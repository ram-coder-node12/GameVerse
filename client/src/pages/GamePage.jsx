// client/src/pages/GamePage.jsx
import React, { useState, useEffect } from 'react';
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
  Swords
} from 'lucide-react';

export default function GamePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, status: connectionStatus } = useSocket();
  const { user, refreshUser } = useAuth();

  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameType, setGameType] = useState(null);
  const [rejectedReason, setRejectedReason] = useState(null);
  const [disconnectInfo, setDisconnectInfo] = useState(null);
  const [rematchStatus, setRematchStatus] = useState(null); // 'OFFERED' | 'REQUESTED' | null
  const [gameOverData, setGameOverData] = useState(null);

  // Initialize or reconnect to room
  useEffect(() => {
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
      refreshUser(); // update rating in navbar

      const currentUserId = user?._id || user?.id;
      if (data.winner && data.winner.id === currentUserId) {
        // Trigger celebratory confetti for winner!
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {}
      }
    };

    const handlePlayerDisconnected = ({ userId, username, reconnectWindowSeconds }) => {
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

    socket.on('game_state', handleGameState);
    socket.on('move_rejected', handleMoveRejected);
    socket.on('game_over', handleGameOver);
    socket.on('player_disconnected', handlePlayerDisconnected);
    socket.on('player_reconnected', handlePlayerReconnected);
    socket.on('rematch_offered', handleRematchOffered);
    socket.on('rematch_started', handleRematchStarted);

    return () => {
      socket.off('game_state', handleGameState);
      socket.off('move_rejected', handleMoveRejected);
      socket.off('game_over', handleGameOver);
      socket.off('player_disconnected', handlePlayerDisconnected);
      socket.off('player_reconnected', handlePlayerReconnected);
      socket.off('rematch_offered', handleRematchOffered);
      socket.off('rematch_started', handleRematchStarted);
    };
  }, [socket, roomId, user, refreshUser]);

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

  const handleMakeMove = (moveData) => {
    if (!socket || !roomId) return;
    setRejectedReason(null);
    socket.emit('player_move', { roomId, moveData });
  };

  const handleRematch = () => {
    if (!socket || !roomId) return;
    socket.emit('rematch_request', { roomId });
    setRematchStatus('REQUESTED');
  };

  const currentUserId = (user?._id || user?.id || '').toString();

  // Find player roles
  const myPlayerMeta =
    (gameState && gameState.players && gameState.players.find((p) => p.id === currentUserId)) ||
    (players && players.find((p) => p.id === currentUserId));

  const opponentMeta =
    (gameState && gameState.players && gameState.players.find((p) => p.id !== currentUserId)) ||
    (players && players.find((p) => p.id !== currentUserId));

  const isMyTurn = gameState && gameState.currentTurn === currentUserId && gameState.status === 'IN_PROGRESS';

  if (!gameState) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div className="radar-circle" style={{ width: 80, height: 80, margin: '0 auto 20px' }} />
        <h3 style={{ color: '#fff', fontSize: '1.4rem' }}>Connecting to Game Arena...</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 8 }}>
          Setting up authoritative match state
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
          marginBottom: 20
        }}
      >
        <button
          onClick={() => navigate('/')}
          className="btn btn-secondary btn-sm"
          style={{ gap: 6 }}
        >
          <ArrowLeft size={16} />
          Lobby
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-cyan">
            {gameType === 'CONNECT_FOUR' ? 'Connect Four' : 'Tic-Tac-Toe'}
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
            borderRadius: 'var(--radius-sm)',
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
            borderRadius: 'var(--radius-sm)',
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
      <div
        className="glass-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          marginBottom: 24
        }}
      >
        {/* Current User */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: isMyTurn ? 1 : 0.75,
            transition: 'opacity 0.2s'
          }}
        >
          <div style={{ position: 'relative' }}>
            <img
              src={myPlayerMeta?.avatar || user?.avatar}
              alt="You"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#1a1f33',
                border: isMyTurn ? '2px solid var(--neon-cyan)' : '2px solid transparent'
              }}
            />
            {myPlayerMeta?.symbol && (
              <span
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  background: myPlayerMeta.symbol === 'X' || myPlayerMeta.symbol === 'red' ? '#00f2fe' : '#ff007f',
                  color: '#050b14',
                  fontWeight: 800,
                  fontSize: '0.65rem',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textTransform: 'uppercase'
                }}
              >
                {myPlayerMeta.symbol.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem' }}>
              {myPlayerMeta?.username || 'You'} <span style={{ fontSize: '0.75rem', color: 'var(--neon-cyan)' }}>(You)</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--neon-gold)', fontWeight: 600 }}>
              ★ {myPlayerMeta?.rating || user?.rating}
            </div>
          </div>
        </div>

        {/* Center Turn / Match Status Indicator */}
        <div style={{ textAlign: 'center' }}>
          {gameState.status === 'IN_PROGRESS' ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                background: isMyTurn ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                border: isMyTurn ? '1px solid var(--neon-cyan)' : '1px solid var(--border-subtle)',
                boxShadow: isMyTurn ? '0 0 15px rgba(0, 242, 254, 0.3)' : 'none'
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: isMyTurn ? '#00f2fe' : '#9ca3af'
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: isMyTurn ? '#00f2fe' : 'var(--text-muted)'
                }}
              >
                {isMyTurn ? 'YOUR TURN' : "OPPONENT'S TURN"}
              </span>
            </div>
          ) : (
            <span className="badge badge-purple" style={{ fontSize: '0.85rem' }}>
              GAME COMPLETED
            </span>
          )}
        </div>

        {/* Opponent */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            opacity: !isMyTurn && gameState.status === 'IN_PROGRESS' ? 1 : 0.75,
            transition: 'opacity 0.2s',
            flexDirection: 'row-reverse',
            textAlign: 'right'
          }}
        >
          <div style={{ position: 'relative' }}>
            <img
              src={opponentMeta?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=opponent'}
              alt="Opponent"
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#1a1f33',
                border: !isMyTurn && gameState.status === 'IN_PROGRESS' ? '2px solid var(--neon-pink)' : '2px solid transparent'
              }}
            />
            {opponentMeta?.symbol && (
              <span
                style={{
                  position: 'absolute',
                  bottom: -2,
                  left: -2,
                  background: opponentMeta.symbol === 'X' || opponentMeta.symbol === 'red' ? '#00f2fe' : '#ff007f',
                  color: '#050b14',
                  fontWeight: 800,
                  fontSize: '0.65rem',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textTransform: 'uppercase'
                }}
              >
                {opponentMeta.symbol.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.05rem' }}>
              {opponentMeta?.username || 'Opponent'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--neon-gold)', fontWeight: 600 }}>
              ★ {opponentMeta?.rating || 1000}
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Board Area */}
      <div style={{ margin: '30px 0' }}>
        {gameType === 'CONNECT_FOUR' ? (
          <ConnectFourBoard
            board={gameState.board}
            onMakeMove={handleMakeMove}
            isMyTurn={isMyTurn}
            mySymbol={myPlayerMeta?.symbol}
            winningCells={gameState.winningCells}
            disabled={gameState.status !== 'IN_PROGRESS'}
          />
        ) : (
          <TicTacToeBoard
            board={gameState.board}
            onMakeMove={handleMakeMove}
            isMyTurn={isMyTurn}
            mySymbol={myPlayerMeta?.symbol}
            winningLine={gameState.winningLine}
            disabled={gameState.status !== 'IN_PROGRESS'}
          />
        )}
      </div>

      {/* Game Completed Result Modal / Card */}
      {gameState.status !== 'IN_PROGRESS' && (
        <div
          className="glass-card glow-cyan"
          style={{
            maxWidth: 480,
            margin: '0 auto',
            textAlign: 'center',
            padding: 30,
            animation: 'float 4s ease-in-out infinite'
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              margin: '0 auto 12px',
              background: 'rgba(0, 242, 254, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Trophy size={28} color="#00f2fe" />
          </div>

          <h2 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: 4 }}>
            {gameState.isDraw
              ? "It's a Draw!"
              : gameState.winner?.id === currentUserId
              ? 'Victory!'
              : 'Defeat'}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
            {gameState.isDraw
              ? 'Both players demonstrated equal mastery.'
              : gameState.winner?.id === currentUserId
              ? `Congratulations! You won the ${gameType === 'CONNECT_FOUR' ? 'Connect Four' : 'Tic-Tac-Toe'} match.`
              : `${opponentMeta?.username || 'Opponent'} took the victory.`}
          </p>

          {/* Rating Change Display */}
          {gameOverData?.ratings && gameOverData.ratings[currentUserId] && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                marginBottom: 20
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rating:</span>
              <strong style={{ color: '#fff' }}>
                {gameOverData.ratings[currentUserId].ratingAfter}
              </strong>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color:
                    gameOverData.ratings[currentUserId].ratingChange >= 0
                      ? 'var(--neon-green)'
                      : 'var(--neon-red)'
                }}
              >
                {gameOverData.ratings[currentUserId].ratingChange >= 0 ? '+' : ''}
                {gameOverData.ratings[currentUserId].ratingChange}
              </span>
            </div>
          )}

          {/* Rematch & Lobby Controls */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Return to Lobby
            </button>

            <button
              onClick={handleRematch}
              disabled={rematchStatus === 'REQUESTED'}
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              <RotateCcw size={16} />
              {rematchStatus === 'REQUESTED'
                ? 'Waiting for Opponent...'
                : rematchStatus === 'OFFERED'
                ? 'Accept Rematch'
                : 'Rematch'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
