// server/sockets/socketHandler.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const matchmakingService = require('../services/matchmakingService');
const TicTacToeEngine = require('../games/TicTacToeEngine');
const ConnectFourEngine = require('../games/ConnectFourEngine');
const RatingService = require('../services/ratingService');
const Game = require('../models/Game');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

// In-memory active game rooms: roomId -> roomData
const activeRooms = new Map();

// Map userId -> Set of socket IDs
const userSockets = new Map();

// Map socketId -> userId
const socketUser = new Map();

// Pending friend challenges: challengeId -> challengeData
const pendingChallenges = new Map();

function initSocket(io) {
  // Socket.IO authentication middleware
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth && socket.handshake.auth.token;

      if (!token && socket.handshake.headers.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      // Check cookie if not found in auth payload
      if (!token && socket.handshake.headers.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';');
        for (const cookie of cookies) {
          const [name, val] = cookie.trim().split('=');
          if (name === 'token') {
            token = decodeURIComponent(val);
            break;
          }
        }
      }

      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded;
      }
      return next();
    } catch (err) {
      logger.warn('Socket connection without valid auth token:', err.message);
      // Still allow connection as guest/spectator, but actions will require auth
      return next();
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user ? socket.user.id : null;

    if (userId) {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      socketUser.set(socket.id, userId);

      logger.info(`Socket connected for authenticated user: ${userId} (${socket.id})`);
    } else {
      logger.info(`Anonymous socket connected: ${socket.id}`);
    }

    // Broadcast current online player count
    io.emit('online_count', { count: userSockets.size });

    // ==========================================
    // 1. MATCHMAKING QUEUE EVENTS
    // ==========================================

    socket.on('join_queue', ({ gameType, user }) => {
      if (!socket.user && !user) {
        return socket.emit('error_message', { message: 'Authentication required to enter matchmaking.' });
      }

      const playerUser = user || { id: socket.user.id, username: 'Player', rating: 1000 };
      const selectedGameType = gameType === 'CONNECT_FOUR' ? 'CONNECT_FOUR' : 'TIC_TAC_TOE';

      const result = matchmakingService.joinQueue(selectedGameType, socket.id, playerUser);

      if (result.matched) {
        const { roomId, player1, player2 } = result.match;

        // Instantiate authoritative engine
        let engine;
        if (selectedGameType === 'CONNECT_FOUR') {
          engine = new ConnectFourEngine([player1.user, player2.user]);
        } else {
          engine = new TicTacToeEngine([player1.user, player2.user]);
        }

        const roomData = {
          roomId,
          gameType: selectedGameType,
          engine,
          players: [
            { ...player1.user, socketId: player1.socketId, symbol: engine.players[0].symbol, connected: true },
            { ...player2.user, socketId: player2.socketId, symbol: engine.players[1].symbol, connected: true }
          ],
          startedAt: new Date(),
          rematchRequests: new Set(),
          disconnectTimer: null
        };

        activeRooms.set(roomId, roomData);

        // Join sockets to room
        const s1 = io.sockets.sockets.get(player1.socketId);
        const s2 = io.sockets.sockets.get(player2.socketId);

        if (s1) s1.join(`game_${roomId}`);
        if (s2) s2.join(`game_${roomId}`);

        // Notify both players with personalized match info
        const initialState = engine.getState();

        if (s1) {
          s1.emit('match_found', {
            roomId,
            gameType: selectedGameType,
            mySymbol: engine.players[0].symbol,
            myTurn: engine.currentTurn === player1.user.id,
            opponent: player2.user,
            state: initialState
          });
        }

        if (s2) {
          s2.emit('match_found', {
            roomId,
            gameType: selectedGameType,
            mySymbol: engine.players[1].symbol,
            myTurn: engine.currentTurn === player2.user.id,
            opponent: player1.user,
            state: initialState
          });
        }
      } else {
        socket.emit('queue_status', { inQueue: true, gameType: selectedGameType });
      }
    });

    socket.on('leave_queue', ({ gameType }) => {
      const uId = socket.user ? socket.user.id : (socketUser.get(socket.id) || socket.id);
      matchmakingService.leaveQueueAll(uId, socket.id);
      socket.emit('queue_status', { inQueue: false });
    });

    // ==========================================
    // 2. IN-GAME EVENTS & SERVER VALIDATION
    // ==========================================

    socket.on('join_game', ({ roomId }) => {
      const room = activeRooms.get(roomId);
      if (!room) {
        return socket.emit('error_message', { message: 'Game room not found or already finished.' });
      }

      socket.join(`game_${roomId}`);

      const currentUserId = socket.user ? socket.user.id : socketUser.get(socket.id);
      const player = room.players.find((p) => p.id === currentUserId);

      if (player) {
        player.socketId = socket.id;
        player.connected = true;

        // Clear disconnect timer if reconnecting
        if (room.disconnectTimer) {
          clearTimeout(room.disconnectTimer);
          room.disconnectTimer = null;
          io.to(`game_${roomId}`).emit('player_reconnected', {
            userId: currentUserId,
            username: player.username
          });
        }
      }

      socket.emit('game_state', {
        state: room.engine.getState(),
        players: room.players
      });
    });

    socket.on('player_move', async ({ roomId, moveData }) => {
      const room = activeRooms.get(roomId);
      if (!room) {
        return socket.emit('move_rejected', { reason: 'Game room does not exist.' });
      }

      if (room.engine.isGameOver()) {
        return socket.emit('move_rejected', { reason: 'Game is already finished.' });
      }

      const currentUserId = socket.user ? socket.user.id : socketUser.get(socket.id);
      if (!currentUserId) {
        return socket.emit('move_rejected', { reason: 'Unauthorized player.' });
      }

      // Execute authoritative move on engine
      const moveResult = room.engine.makeMove(currentUserId, moveData);

      if (!moveResult.success) {
        return socket.emit('move_rejected', { reason: moveResult.error });
      }

      // Broadcast valid move and updated authoritative state to both players
      io.to(`game_${roomId}`).emit('game_state', {
        state: moveResult.state,
        lastMove: {
          playerId: currentUserId,
          moveData,
          placedRow: moveResult.placedRow,
          placedCol: moveResult.placedCol
        }
      });

      // Handle Game Over
      if (room.engine.isGameOver()) {
        const state = room.engine.getState();
        const p1 = room.players[0];
        const p2 = room.players[1];

        const duration = Math.max(1, Math.round((Date.now() - room.startedAt.getTime()) / 1000));
        const winnerId = state.winner ? state.winner.id : null;
        const isDraw = state.isDraw;

        // Update database ratings & user stats
        let ratings = {};
        try {
          ratings = await RatingService.applyGameResult(p1.id, p2.id, winnerId, isDraw);
        } catch (err) {
          logger.error('Failed to update player ratings:', err);
        }

        // Persist completed game to MongoDB
        try {
          await Game.create({
            gameType: room.gameType,
            roomId: room.roomId,
            players: [
              {
                user: p1.id,
                symbol: p1.symbol,
                ratingBefore: ratings[p1.id] ? ratings[p1.id].ratingBefore : 1000,
                ratingAfter: ratings[p1.id] ? ratings[p1.id].ratingAfter : 1000,
                ratingChange: ratings[p1.id] ? ratings[p1.id].ratingChange : 0
              },
              {
                user: p2.id,
                symbol: p2.symbol,
                ratingBefore: ratings[p2.id] ? ratings[p2.id].ratingBefore : 1000,
                ratingAfter: ratings[p2.id] ? ratings[p2.id].ratingAfter : 1000,
                ratingChange: ratings[p2.id] ? ratings[p2.id].ratingChange : 0
              }
            ],
            status: 'COMPLETED',
            winner: winnerId,
            isDraw,
            result: isDraw ? 'DRAW' : 'WIN',
            moves: state.moves.map((m) => ({
              player: m.player,
              moveData: { symbol: m.symbol, position: m.position, col: m.col, row: m.row },
              timestamp: m.timestamp
            })),
            gameState: state,
            startedAt: room.startedAt,
            endedAt: new Date(),
            duration
          });
          logger.info(`Game ${roomId} successfully persisted to MongoDB.`);
        } catch (err) {
          logger.error('Failed to persist game to database:', err);
        }

        // Broadcast game_over event to room
        io.to(`game_${roomId}`).emit('game_over', {
          result: isDraw ? 'DRAW' : 'WIN',
          winner: state.winner,
          isDraw,
          winningLine: state.winningLine,
          winningCells: state.winningCells,
          ratings,
          duration,
          state
        });
      }
    });

    // ==========================================
    // 3. REMATCH WORKFLOW
    // ==========================================

    socket.on('rematch_request', ({ roomId }) => {
      const room = activeRooms.get(roomId);
      if (!room) return;

      const currentUserId = socket.user ? socket.user.id : socketUser.get(socket.id);
      if (!currentUserId) return;

      room.rematchRequests.add(currentUserId.toString());

      // If both players agreed to rematch:
      if (room.rematchRequests.size >= 2) {
        room.rematchRequests.clear();

        // Swap symbols and who starts
        const reversedPlayers = [room.players[1], room.players[0]];
        if (room.gameType === 'CONNECT_FOUR') {
          room.engine = new ConnectFourEngine(reversedPlayers);
        } else {
          room.engine = new TicTacToeEngine(reversedPlayers);
        }

        room.startedAt = new Date();
        room.players = [
          { ...reversedPlayers[0], symbol: room.engine.players[0].symbol },
          { ...reversedPlayers[1], symbol: room.engine.players[1].symbol }
        ];

        io.to(`game_${roomId}`).emit('rematch_started', {
          state: room.engine.getState(),
          players: room.players
        });
      } else {
        // Notify opponent that rematch was offered
        socket.to(`game_${roomId}`).emit('rematch_offered', {
          requestedBy: currentUserId
        });
      }
    });

    // ==========================================
    // 4. REAL-TIME FRIEND CHALLENGES
    // ==========================================

    socket.on('challenge_friend', ({ friendId, gameType, challenger }) => {
      const senderId = socket.user ? socket.user.id : socketUser.get(socket.id);
      if (!senderId || !friendId) return;

      const challengeId = `chal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const selectedGameType = gameType || 'TIC_TAC_TOE';

      pendingChallenges.set(challengeId, {
        challengeId,
        senderId,
        friendId,
        gameType: selectedGameType,
        challenger: challenger || { id: senderId, username: 'Player', rating: 1000 },
        createdAt: Date.now()
      });

      // Send to friend's connected sockets
      const recipientSockets = userSockets.get(friendId.toString());
      if (recipientSockets && recipientSockets.size > 0) {
        for (const sockId of recipientSockets) {
          io.to(sockId).emit('challenge_received', {
            challengeId,
            gameType: selectedGameType,
            challenger: challenger || { id: senderId, username: 'Player', rating: 1000 }
          });
        }
      } else {
        socket.emit('error_message', { message: 'Friend is currently offline.' });
      }
    });

    socket.on('challenge_response', ({ challengeId, accepted }) => {
      const challenge = pendingChallenges.get(challengeId);
      if (!challenge) {
        return socket.emit('error_message', { message: 'Challenge has expired or was cancelled.' });
      }

      pendingChallenges.delete(challengeId);

      const senderSockets = userSockets.get(challenge.senderId.toString());

      if (!accepted) {
        if (senderSockets) {
          for (const sId of senderSockets) {
            io.to(sId).emit('challenge_declined', { message: 'Friend declined the challenge.' });
          }
        }
        return;
      }

      // Challenge Accepted: create game room immediately!
      const roomId = `room_friend_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const currentUserId = socket.user ? socket.user.id : socketUser.get(socket.id);

      const p1 = challenge.challenger;
      const p2 = { id: currentUserId, username: socket.user ? socket.user.username : 'Friend', rating: 1000 };

      let engine;
      if (challenge.gameType === 'CONNECT_FOUR') {
        engine = new ConnectFourEngine([p1, p2]);
      } else {
        engine = new TicTacToeEngine([p1, p2]);
      }

      const roomData = {
        roomId,
        gameType: challenge.gameType,
        engine,
        players: [
          { ...p1, symbol: engine.players[0].symbol, connected: true },
          { ...p2, symbol: engine.players[1].symbol, connected: true }
        ],
        startedAt: new Date(),
        rematchRequests: new Set(),
        disconnectTimer: null
      };

      activeRooms.set(roomId, roomData);

      // Notify both players to join the new game room
      if (senderSockets) {
        for (const sId of senderSockets) {
          io.to(sId).emit('challenge_accepted', {
            roomId,
            gameType: challenge.gameType,
            mySymbol: engine.players[0].symbol,
            opponent: p2
          });
        }
      }

      socket.emit('challenge_accepted', {
        roomId,
        gameType: challenge.gameType,
        mySymbol: engine.players[1].symbol,
        opponent: p1
      });
    });

    // ==========================================
    // 5. DISCONNECT & RECONNECTION RESILIENCE
    // ==========================================

    socket.on('disconnect', () => {
      const uId = socketUser.get(socket.id);

      // Remove from matchmaking queues
      if (uId) {
        matchmakingService.leaveQueueAll(uId, socket.id);
      }

      // Check if user has other sockets open
      if (uId && userSockets.has(uId)) {
        userSockets.get(uId).delete(socket.id);
        if (userSockets.get(uId).size === 0) {
          userSockets.delete(uId);
        }
      }
      socketUser.delete(socket.id);

      // Broadcast updated online count
      io.emit('online_count', { count: userSockets.size });

      // Check active game rooms for this socket
      for (const [roomId, room] of activeRooms.entries()) {
        const disconnectedPlayer = room.players.find((p) => p.socketId === socket.id || p.id === uId);

        if (disconnectedPlayer && !room.engine.isGameOver()) {
          disconnectedPlayer.connected = false;

          // Notify opponent about disconnect with 30s grace window
          socket.to(`game_${roomId}`).emit('player_disconnected', {
            userId: disconnectedPlayer.id,
            username: disconnectedPlayer.username,
            reconnectWindowSeconds: 30
          });

          // Set 30s forfeit countdown
          if (!room.disconnectTimer) {
            room.disconnectTimer = setTimeout(async () => {
              if (room.engine.isGameOver()) return;

              logger.info(`Forfeiting room ${roomId} due to disconnected player.`);
              const survivingPlayer = room.players.find((p) => p.id !== disconnectedPlayer.id);

              room.engine.status = 'ABANDONED';
              room.engine.winner = survivingPlayer;

              // Persist forfeit win
              try {
                await RatingService.applyGameResult(
                  survivingPlayer.id,
                  disconnectedPlayer.id,
                  survivingPlayer.id,
                  false
                );
              } catch (err) {
                logger.error('Failed to update ratings on forfeit:', err);
              }

              io.to(`game_${roomId}`).emit('game_over', {
                result: 'FORFEIT',
                winner: survivingPlayer,
                message: `${disconnectedPlayer.username} disconnected and failed to reconnect.`
              });

              activeRooms.delete(roomId);
            }, 30000);
          }
        }
      }
    });
  });
}

module.exports = { initSocket };
