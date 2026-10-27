// client/src/pages/GamePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import TicTacToeBoard from '../games/tic-tac-toe/TicTacToeBoard';
import ConnectFourBoard from '../games/connect-four/ConnectFourBoard';
import confetti from 'canvas-confetti';
import {
  Trophy,
  ArrowLeft,
  RotateCcw,
  Wifi,
  WifiOff,
  AlertCircle,
  Clock,
  Swords,
  MessageSquare,
  Send,
  Bot,
  Sparkles,
  Zap
} from 'lucide-react';

export default function GamePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, status: connectionStatus } = useSocket();
  const { user, refreshUser } = useAuth();

  const isPracticeMode = roomId && roomId.startsWith('practice');
  const practiceGameType = roomId && roomId.includes('connectfour') ? 'CONNECT_FOUR' : 'TIC_TAC_TOE';

  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameType, setGameType] = useState(practiceGameType);
  const [rejectedReason, setRejectedReason] = useState(null);
  const [disconnectInfo, setDisconnectInfo] = useState(null);
  const [rematchStatus, setRematchStatus] = useState(null); // 'OFFERED' | 'REQUESTED' | null
  const [gameOverData, setGameOverData] = useState(null);
  const [botThinking, setBotThinking] = useState(false);

  // In-Game Live Chat & Emotes
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      senderUsername: 'Arena System',
      message: isPracticeMode
        ? 'Welcome to AI Practice Arena. Move whenever you are ready!'
        : 'Match room ready. Good luck and have fun!',
      isSystem: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const chatScrollRef = useRef(null);

  const currentUserId = (user?._id || user?.id || 'guest_user').toString();

  // Scroll chat to bottom on new message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatOpen]);

  // ==========================================
  // PRACTICE VS AI MODE LOGIC
  // ==========================================

  // Tic-Tac-Toe AI Win/Draw checker
  const checkTicTacToeWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winnerSymbol: squares[a], line: [a, b, c] };
      }
    }
    if (squares.every((s) => s !== null)) {
      return { winnerSymbol: 'DRAW', line: [] };
    }
    return null;
  };

  // Connect Four AI Win/Draw checker
  const checkConnectFourWinner = (grid) => {
    const ROWS = 6;
    const COLS = 7;

    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const val = grid[r][c];
        if (val && val === grid[r][c + 1] && val === grid[r][c + 2] && val === grid[r][c + 3]) {
          return {
            winnerSymbol: val,
            cells: [{ row: r, col: c }, { row: r, col: c + 1 }, { row: r, col: c + 2 }, { row: r, col: c + 3 }]
          };
        }
      }
    }

    // Vertical
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS - 3; r++) {
        const val = grid[r][c];
        if (val && val === grid[r + 1][c] && val === grid[r + 2][c] && val === grid[r + 3][c]) {
          return {
            winnerSymbol: val,
            cells: [{ row: r, col: c }, { row: r + 1, col: c }, { row: r + 2, col: c }, { row: r + 3, col: c }]
          };
        }
      }
    }

    // Diagonal Up-Right
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const val = grid[r][c];
        if (val && val === grid[r - 1][c + 1] && val === grid[r - 2][c + 2] && val === grid[r - 3][c + 3]) {
          return {
            winnerSymbol: val,
            cells: [{ row: r, col: c }, { row: r - 1, col: c + 1 }, { row: r - 2, col: c + 2 }, { row: r - 3, col: c + 3 }]
          };
        }
      }
    }

    // Diagonal Down-Right
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        const val = grid[r][c];
        if (val && val === grid[r + 1][c + 1] && val === grid[r + 2][c + 2] && val === grid[r + 3][c + 3]) {
          return {
            winnerSymbol: val,
            cells: [{ row: r, col: c }, { row: r + 1, col: c + 1 }, { row: r + 2, col: c + 2 }, { row: r + 3, col: c + 3 }]
          };
        }
      }
    }

    // Check Draw
    const isFull = grid[0].every((cell) => cell !== null);
    if (isFull) {
      return { winnerSymbol: 'DRAW', cells: [] };
    }

    return null;
  };

  // Helper to initialize Practice Mode
  const initPracticeState = (type) => {
    const isC4 = type === 'CONNECT_FOUR';
    const player1 = {
      id: currentUserId,
      username: user?.username || 'You',
      avatar: user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=You',
      symbol: isC4 ? 'red' : 'X',
      rating: user?.rating || 1000
    };
    const playerAI = {
      id: 'ai_bot',
      username: 'GameVerse Bot (AI)',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GameVerseAI',
      symbol: isC4 ? 'yellow' : 'O',
      rating: 1200
    };

    setPlayers([player1, playerAI]);
    setGameType(type);
    setGameOverData(null);
    setRematchStatus(null);
    setBotThinking(false);

    setGameState({
      roomId,
      gameType: type,
      board: isC4
        ? Array(6).fill(null).map(() => Array(7).fill(null))
        : Array(9).fill(null),
      currentTurn: currentUserId,
      status: 'IN_PROGRESS',
      players: [player1, playerAI],
      winner: null,
      isDraw: false,
      winningLine: null,
      winningCells: null
    });
  };

  useEffect(() => {
    if (isPracticeMode) {
      initPracticeState(practiceGameType);
      return;
    }

    // ==========================================
    // MULTIPLAYER SOCKET EVENTS
    // ==========================================
    if (!socket || !roomId) return;

    socket.emit('join_game', { roomId });

    const handleGameState = ({ state, players: roomPlayers }) => {
      setGameState(state);
      setGameType(state.gameType);
      if (roomPlayers) setPlayers(roomPlayers);
    };

    const handleMoveRejected = ({ reason }) => {
      setRejectedReason(reason);
      setTimeout(() => setRejectedReason(null), 3500);
    };

    const handleGameOver = (data) => {
      setGameOverData(data);
      setGameState(data.state || null);
      refreshUser();

      if (data.winner && data.winner.id === currentUserId) {
        try {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }
    };

    const handlePlayerDisconnected = ({ username, reconnectWindowSeconds }) => {
      setDisconnectInfo({ username, seconds: reconnectWindowSeconds || 30 });
    };

    const handlePlayerReconnected = () => {
      setDisconnectInfo(null);
    };

    const handleRematchOffered = () => {
      setRematchStatus('OFFERED');
    };

    const handleRematchStarted = ({ state, players: newPlayers }) => {
      setGameState(state);
      setPlayers(newPlayers);
      setGameOverData(null);
      setRematchStatus(null);
    };

    const handleGameChat = (payload) => {
      setChatMessages((prev) => [...prev, payload]);
    };

    socket.on('game_state', handleGameState);
    socket.on('move_rejected', handleMoveRejected);
    socket.on('game_over', handleGameOver);
    socket.on('player_disconnected', handlePlayerDisconnected);
    socket.on('player_reconnected', handlePlayerReconnected);
    socket.on('rematch_offered', handleRematchOffered);
    socket.on('rematch_started', handleRematchStarted);
    socket.on('game_chat_message', handleGameChat);

    return () => {
      socket.off('game_state', handleGameState);
      socket.off('move_rejected', handleMoveRejected);
      socket.off('game_over', handleGameOver);
      socket.off('player_disconnected', handlePlayerDisconnected);
      socket.off('player_reconnected', handlePlayerReconnected);
      socket.off('rematch_offered', handleRematchOffered);
      socket.off('rematch_started', handleRematchStarted);
      socket.off('game_chat_message', handleGameChat);
    };
  }, [socket, roomId, user, isPracticeMode, practiceGameType]);

  // Countdown timer for disconnect forfeit
  useEffect(() => {
    let timer = null;
    if (disconnectInfo && disconnectInfo.seconds > 0) {
      timer = setInterval(() => {
        setDisconnectInfo((prev) => (prev ? { ...prev, seconds: prev.seconds - 1 } : null));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [disconnectInfo]);

  // Handle Player Moves
  const handleMakeMove = (moveData) => {
    if (!gameState || gameState.status !== 'IN_PROGRESS') return;

    // A. Offline Practice Mode execution
    if (isPracticeMode) {
      if (gameState.currentTurn !== currentUserId || botThinking) return;

      if (gameType === 'TIC_TAC_TOE') {
        const index = moveData;
        if (gameState.board[index] !== null) return;

        const newBoard = [...gameState.board];
        newBoard[index] = 'X';

        const result = checkTicTacToeWinner(newBoard);
        if (result) {
          const isDraw = result.winnerSymbol === 'DRAW';
          const winner = isDraw ? null : players[0];
          setGameState((prev) => ({
            ...prev,
            board: newBoard,
            status: 'COMPLETED',
            winner,
            isDraw,
            winningLine: result.line
          }));
          if (!isDraw) {
            try {
              confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            } catch (e) {}
          }
          return;
        }

        // Switch turn to Bot AI
        setGameState((prev) => ({
          ...prev,
          board: newBoard,
          currentTurn: 'ai_bot'
        }));
        setBotThinking(true);

        setTimeout(() => {
          const emptyIndices = newBoard
            .map((val, idx) => (val === null ? idx : null))
            .filter((val) => val !== null);

          if (emptyIndices.length === 0) return;

          // AI Move Selection:
          let chosen = null;
          // Win if possible
          for (const idx of emptyIndices) {
            const b = [...newBoard];
            b[idx] = 'O';
            if (checkTicTacToeWinner(b)?.winnerSymbol === 'O') {
              chosen = idx;
              break;
            }
          }
          // Block human win
          if (chosen === null) {
            for (const idx of emptyIndices) {
              const b = [...newBoard];
              b[idx] = 'X';
              if (checkTicTacToeWinner(b)?.winnerSymbol === 'X') {
                chosen = idx;
                break;
              }
            }
          }
          // Center or random
          if (chosen === null) {
            if (emptyIndices.includes(4) && Math.random() > 0.35) {
              chosen = 4;
            } else {
              chosen = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            }
          }

          newBoard[chosen] = 'O';
          const botResult = checkTicTacToeWinner(newBoard);
          if (botResult) {
            const isDraw = botResult.winnerSymbol === 'DRAW';
            const winner = isDraw ? null : players[1];
            setGameState((prev) => ({
              ...prev,
              board: newBoard,
              status: 'COMPLETED',
              winner,
              isDraw,
              winningLine: botResult.line,
              currentTurn: currentUserId
            }));
          } else {
            setGameState((prev) => ({
              ...prev,
              board: newBoard,
              currentTurn: currentUserId
            }));
          }
          setBotThinking(false);
        }, 450);
      } else {
        // Connect Four Practice
        const col = moveData;
        const grid = gameState.board.map((row) => [...row]);
        let placedRow = -1;
        for (let r = 5; r >= 0; r--) {
          if (grid[r][col] === null) {
            grid[r][col] = 'red';
            placedRow = r;
            break;
          }
        }
        if (placedRow === -1) return;

        const result = checkConnectFourWinner(grid);
        if (result) {
          const isDraw = result.winnerSymbol === 'DRAW';
          const winner = isDraw ? null : players[0];
          setGameState((prev) => ({
            ...prev,
            board: grid,
            status: 'COMPLETED',
            winner,
            isDraw,
            winningCells: result.cells
          }));
          if (!isDraw) {
            try {
              confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
            } catch (e) {}
          }
          return;
        }

        setGameState((prev) => ({
          ...prev,
          board: grid,
          currentTurn: 'ai_bot'
        }));
        setBotThinking(true);

        setTimeout(() => {
          // Valid columns
          const validCols = [];
          for (let c = 0; c < 7; c++) {
            if (grid[0][c] === null) validCols.push(c);
          }
          if (validCols.length === 0) return;

          // AI pick: win or block or center
          let chosenCol = null;

          // Win check
          for (const c of validCols) {
            const testGrid = grid.map((r) => [...r]);
            for (let r = 5; r >= 0; r--) {
              if (testGrid[r][c] === null) {
                testGrid[r][c] = 'yellow';
                if (checkConnectFourWinner(testGrid)?.winnerSymbol === 'yellow') {
                  chosenCol = c;
                }
                break;
              }
            }
            if (chosenCol !== null) break;
          }

          // Block human win
          if (chosenCol === null) {
            for (const c of validCols) {
              const testGrid = grid.map((r) => [...r]);
              for (let r = 5; r >= 0; r--) {
                if (testGrid[r][c] === null) {
                  testGrid[r][c] = 'red';
                  if (checkConnectFourWinner(testGrid)?.winnerSymbol === 'red') {
                    chosenCol = c;
                  }
                  break;
                }
              }
              if (chosenCol !== null) break;
            }
          }

          if (chosenCol === null) {
            chosenCol = validCols.includes(3) && Math.random() > 0.4
              ? 3
              : validCols[Math.floor(Math.random() * validCols.length)];
          }

          for (let r = 5; r >= 0; r--) {
            if (grid[r][chosenCol] === null) {
              grid[r][chosenCol] = 'yellow';
              break;
            }
          }

          const botResult = checkConnectFourWinner(grid);
          if (botResult) {
            const isDraw = botResult.winnerSymbol === 'DRAW';
            const winner = isDraw ? null : players[1];
            setGameState((prev) => ({
              ...prev,
              board: grid,
              status: 'COMPLETED',
              winner,
              isDraw,
              winningCells: botResult.cells,
              currentTurn: currentUserId
            }));
          } else {
            setGameState((prev) => ({
              ...prev,
              board: grid,
              currentTurn: currentUserId
            }));
          }
          setBotThinking(false);
        }, 450);
      }
      return;
    }

    // B. Online Multiplayer Move
    if (!socket || !roomId) return;
    setRejectedReason(null);
    socket.emit('player_move', { roomId, moveData });
  };

  // Rematch action
  const handleRematch = () => {
    if (isPracticeMode) {
      initPracticeState(practiceGameType);
      return;
    }

    if (!socket || !roomId) return;
    socket.emit('rematch_request', { roomId });
    setRematchStatus('REQUESTED');
  };

  // In-Game Live Chat Sender
  const handleSendMessage = (customMsg = null, emote = null) => {
    const text = customMsg !== null ? customMsg : chatInput.trim();
    if (!text && !emote) return;

    if (isPracticeMode) {
      const newMsg = {
        id: `chat_${Date.now()}`,
        senderUsername: user?.username || 'You',
        message: text || null,
        emote: emote || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages((prev) => [...prev, newMsg]);
      setChatInput('');

      // Bot reactive banter in Practice mode
      setTimeout(() => {
        let botResponse = 'Good move! Let us keep dueling! 🤖';
        if (emote === '🎉 GG!' || text?.toLowerCase().includes('gg')) {
          botResponse = 'GG! You are a formidable tactician! 🎮';
        } else if (emote === '🔥 Nice Move!') {
          botResponse = 'Thanks! I calculated 4,200 outcomes for that one! ⚡';
        } else if (emote === '⚡ Rematch?') {
          botResponse = 'Anytime! Click Rematch and let us run it back! 🔄';
        } else if (emote === '🤔 Thinking...') {
          botResponse = 'Take your time, human! My processors can wait! ⏳';
        }

        setChatMessages((prev) => [
          ...prev,
          {
            id: `bot_chat_${Date.now()}`,
            senderUsername: 'GameVerse Bot (AI)',
            message: botResponse,
            isBot: true,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 750);
      return;
    }

    // Multiplayer socket chat
    if (socket && roomId) {
      socket.emit('send_game_chat', { roomId, message: text, emote });
      setChatInput('');
    }
  };

  // Find player roles
  const myPlayerMeta =
    (gameState && gameState.players && gameState.players.find((p) => p.id === currentUserId)) ||
    (players && players.find((p) => p.id === currentUserId)) ||
    players[0];

  const opponentMeta =
    (gameState && gameState.players && gameState.players.find((p) => p.id !== currentUserId)) ||
    (players && players.find((p) => p.id !== currentUserId)) ||
    players[1];

  const isMyTurn = gameState && gameState.currentTurn === currentUserId && gameState.status === 'IN_PROGRESS';

  if (!gameState) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div className="radar-circle" style={{ width: 80, height: 80, margin: '0 auto 20px' }} />
        <h3 style={{ color: 'var(--text-main)', fontSize: '1.4rem' }}>
          {isPracticeMode ? 'Initializing AI Arena Engine...' : 'Connecting to Multiplayer Room...'}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 8 }}>
          Authoritative move validation protocol active
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '10px 16px 40px' }}>
      {/* Top Header / Exit */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 10
        }}
      >
        <button
          onClick={() => navigate('/')}
          className="btn btn-secondary btn-sm"
          style={{ gap: 6 }}
        >
          <ArrowLeft size={16} />
          Back to Lobby
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {isPracticeMode ? (
            <span
              style={{
                fontSize: '0.72rem',
                padding: '4px 10px',
                borderRadius: 4,
                background: 'rgba(124, 58, 237, 0.12)',
                color: 'var(--render-purple)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)'
              }}
            >
              ● PRACTICE VS AI
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.72rem',
                padding: '4px 10px',
                borderRadius: 4,
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)'
              }}
            >
              ● LIVE MULTIPLAYER
            </span>
          )}

          <span className="badge badge-cyan">
            {gameType === 'CONNECT_FOUR' ? 'Connect Four (7×6)' : 'Tic-Tac-Toe (3×3)'}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            Room: {roomId.substring(0, 14)}...
          </span>
        </div>
      </div>

      {/* Disconnect Warning Banner */}
      {disconnectInfo && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 6,
            padding: '12px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#fca5a5'
          }}
        >
          <WifiOff size={20} color="#ef4444" />
          <div style={{ flex: 1, fontSize: '0.9rem' }}>
            <strong>{disconnectInfo.username}</strong> temporarily disconnected.{' '}
            <span>Forfeiting in {disconnectInfo.seconds}s if not returned.</span>
          </div>
        </div>
      )}

      {/* Invalid Move Error Alert */}
      {rejectedReason && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: 6,
            padding: '10px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#fcd34d',
            fontSize: '0.88rem'
          }}
        >
          <AlertCircle size={18} />
          <span>{rejectedReason}</span>
        </div>
      )}

      {/* Players Header Card */}
      <div className="glass-card players-header-card" style={{ marginBottom: 24, padding: 20 }}>
        {/* Current User */}
        <div
          className="players-header-p1"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: isMyTurn ? 1 : 0.7,
            transition: 'opacity 0.2s'
          }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={myPlayerMeta?.avatar || user?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=You'}
              alt="You"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: isMyTurn ? '2px solid var(--render-purple)' : '1px solid var(--border-subtle)',
                boxShadow: isMyTurn ? '0 0 12px rgba(124, 58, 237, 0.4)' : 'none'
              }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: 900,
                color: myPlayerMeta?.symbol === 'red' || myPlayerMeta?.symbol === 'X' ? '#0284c7' : '#e11d48'
              }}
            >
              {myPlayerMeta?.symbol === 'red' ? '🔴' : myPlayerMeta?.symbol === 'yellow' ? '🟡' : myPlayerMeta?.symbol}
            </span>
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>
                {myPlayerMeta?.username || user?.username || 'You'}
              </span>
              <span className="badge badge-cyan" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>YOU</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>
              ★ {myPlayerMeta?.rating || user?.rating || 1000} ELO
            </div>
          </div>
        </div>

        {/* Center Arena Status Indicator */}
        <div style={{ textAlign: 'center', padding: '0 16px' }}>
          <div
            style={{
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginBottom: 4
            }}
          >
            {gameState.status === 'COMPLETED'
              ? 'Match Concluded'
              : botThinking
              ? 'Opponent Calculating...'
              : isMyTurn
              ? 'Your Turn'
              : 'Opponent Turn'}
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              background: isMyTurn ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-secondary)',
              border: isMyTurn ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: isMyTurn ? '#10b981' : 'var(--text-dim)'
            }}
          >
            <Clock size={12} />
            <span>{isMyTurn ? 'Make your move' : botThinking ? 'Thinking...' : 'Awaiting turn'}</span>
          </div>
        </div>

        {/* Opponent / AI */}
        <div
          className="players-header-p2"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            opacity: !isMyTurn ? 1 : 0.7,
            transition: 'opacity 0.2s'
          }}
        >
          <div style={{ textAlign: 'right', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
              {isPracticeMode && <Bot size={14} color="var(--render-purple)" />}
              <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>
                {opponentMeta?.username || (isPracticeMode ? 'Arena Bot' : 'Opponent')}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--neon-gold)', fontWeight: 600 }}>
              ★ {opponentMeta?.rating || (isPracticeMode ? 1200 : 1000)} ELO
            </div>
          </div>

          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={opponentMeta?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=GameVerseAI'}
              alt="Opponent"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: !isMyTurn ? '2px solid var(--render-purple)' : '1px solid var(--border-subtle)',
                boxShadow: !isMyTurn ? '0 0 12px rgba(124, 58, 237, 0.4)' : 'none'
              }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.78rem',
                fontWeight: 900,
                color: opponentMeta?.symbol === 'yellow' || opponentMeta?.symbol === 'O' ? '#e11d48' : '#0284c7'
              }}
            >
              {opponentMeta?.symbol === 'yellow' ? '🟡' : opponentMeta?.symbol === 'red' ? '🔴' : opponentMeta?.symbol}
            </span>
          </div>
        </div>
      </div>

      {/* Main Game Board Area */}
      <div style={{ margin: '24px 0' }}>
        {gameType === 'CONNECT_FOUR' ? (
          <ConnectFourBoard
            board={gameState.board}
            onMakeMove={handleMakeMove}
            isMyTurn={isMyTurn}
            mySymbol={myPlayerMeta?.symbol}
            winningCells={gameState.winningCells}
            disabled={gameState.status !== 'IN_PROGRESS' || botThinking}
          />
        ) : (
          <TicTacToeBoard
            board={gameState.board}
            onMakeMove={handleMakeMove}
            isMyTurn={isMyTurn}
            mySymbol={myPlayerMeta?.symbol}
            winningLine={gameState.winningLine}
            disabled={gameState.status !== 'IN_PROGRESS' || botThinking}
          />
        )}
      </div>

      {/* In-Game Live Chat & Emotes Drawer */}
      <div
        className="glass-card"
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 8,
          border: '1px solid var(--border-subtle)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: 8
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={16} color="var(--render-purple)" />
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              In-Game Reactions & Match Chat
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(124, 58, 237, 0.1)',
                color: 'var(--render-purple)',
                fontWeight: 600
              }}
            >
              Live
            </span>
          </div>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
          >
            {isChatOpen ? 'Minimize' : 'Expand'}
          </button>
        </div>

        {/* Quick Reaction Emote Buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {['👍 Nice move!', '🔥 Well played!', '🤔 Thinking...', '⚡ Rematch?', '🎉 GG!'].map((emote) => (
            <button
              key={emote}
              onClick={() => handleSendMessage(null, emote)}
              className="btn btn-secondary btn-sm"
              style={{
                fontSize: '0.78rem',
                padding: '5px 10px',
                borderRadius: 20,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {emote}
            </button>
          ))}
        </div>

        {/* Chat Feed */}
        {isChatOpen && (
          <div>
            <div
              ref={chatScrollRef}
              style={{
                maxHeight: 140,
                overflowY: 'auto',
                background: 'var(--bg-secondary)',
                borderRadius: 6,
                padding: '10px 12px',
                marginBottom: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: '0.82rem'
              }}
            >
              {chatMessages.map((msg, i) => (
                <div key={msg.id || i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, lineHeight: 1.4 }}>
                  <span
                    style={{
                      fontWeight: 700,
                      color: msg.isSystem
                        ? 'var(--render-purple)'
                        : msg.isBot
                        ? '#f59e0b'
                        : msg.senderUsername === (user?.username || 'You')
                        ? '#0284c7'
                        : '#e11d48',
                      flexShrink: 0
                    }}
                  >
                    {msg.senderUsername}:
                  </span>
                  <span style={{ color: 'var(--text-main)', wordBreak: 'break-word' }}>
                    {msg.emote ? <strong style={{ color: 'var(--render-purple)' }}>{msg.emote} </strong> : null}
                    {msg.message}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginLeft: 'auto', flexShrink: 0 }}>
                    {msg.timestamp}
                  </span>
                </div>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              style={{ display: 'flex', gap: 8 }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                maxLength={150}
                placeholder="Send a quick message to your opponent..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: 4,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="btn btn-primary btn-sm"
                style={{ padding: '8px 14px', gap: 6 }}
              >
                <Send size={13} />
                Send
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Game Completed Result Modal / Card */}
      {gameState.status !== 'IN_PROGRESS' && (
        <div
          className="glass-card"
          style={{
            maxWidth: 480,
            margin: '30px auto 0',
            textAlign: 'center',
            padding: 30,
            borderRadius: 8,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '2px solid var(--render-purple)'
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              margin: '0 auto 12px',
              background: 'rgba(124, 58, 237, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Trophy size={28} color="var(--render-purple)" />
          </div>

          <h2 style={{ fontSize: '1.6rem', color: 'var(--text-main)', marginBottom: 4, fontFamily: 'var(--font-heading)' }}>
            {gameState.isDraw
              ? "It's a Draw!"
              : gameState.winner?.id === currentUserId
              ? 'Victory!'
              : 'Defeat'}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
            {gameState.isDraw
              ? 'Both players demonstrated equal mastery and tactics.'
              : gameState.winner?.id === currentUserId
              ? `Congratulations! You claimed victory in the ${gameType === 'CONNECT_FOUR' ? 'Connect Four' : 'Tic-Tac-Toe'} arena.`
              : `${opponentMeta?.username || 'Opponent'} took the win this round.`}
          </p>

          {/* Rating Change Display for Multiplayer */}
          {gameOverData?.ratings && gameOverData.ratings[currentUserId] && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 4,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                marginBottom: 20
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rating:</span>
              <strong style={{ color: 'var(--text-main)' }}>
                {gameOverData.ratings[currentUserId].ratingAfter}
              </strong>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color:
                    gameOverData.ratings[currentUserId].ratingChange >= 0
                      ? '#10b981'
                      : '#ef4444'
                }}
              >
                {gameOverData.ratings[currentUserId].ratingChange >= 0 ? '+' : ''}
                {gameOverData.ratings[currentUserId].ratingChange} PTS
              </span>
            </div>
          )}

          {/* Practice Mode Result Badge */}
          {isPracticeMode && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 4,
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid var(--render-purple)',
                color: 'var(--render-purple)',
                fontSize: '0.82rem',
                fontWeight: 600,
                marginBottom: 20
              }}
            >
              <Sparkles size={14} />
              <span>Practice Match Completed • Instant Rematch Ready</span>
            </div>
          )}

          {/* Rematch & Lobby Controls */}
          <div className="mobile-full-btn-group" style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary mobile-full-btn"
              style={{ flex: 1 }}
            >
              Return to Lobby
            </button>

            <button
              onClick={handleRematch}
              disabled={rematchStatus === 'REQUESTED'}
              className="btn btn-primary mobile-full-btn"
              style={{ flex: 1 }}
            >
              <RotateCcw size={16} />
              {rematchStatus === 'REQUESTED'
                ? 'Waiting for Opponent...'
                : rematchStatus === 'OFFERED'
                ? 'Accept Rematch'
                : 'Play Again / Rematch'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
