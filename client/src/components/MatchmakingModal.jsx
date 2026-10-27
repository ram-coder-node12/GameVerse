// client/src/components/MatchmakingModal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Swords, X, Zap } from 'lucide-react';

export default function MatchmakingModal() {
  const { inQueue, searchingGameType, leaveQueue, socket } = useSocket();
  const [seconds, setSeconds] = useState(0);
  const [matchData, setMatchData] = useState(null);
  const navigate = useNavigate();

  // Elapsed search timer
  useEffect(() => {
    let interval = null;
    if (inQueue) {
      setSeconds(0);
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      setSeconds(0);
    }
    return () => clearInterval(interval);
  }, [inQueue]);

  // Listen for match_found event
  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = (data) => {
      setMatchData(data);
      // Wait 1.2s to show matched opponent, then navigate to game
      setTimeout(() => {
        setMatchData(null);
        leaveQueue();
        navigate(`/game/${data.roomId}`, { state: { matchData: data } });
      }, 1200);
    };

    socket.on('match_found', handleMatchFound);

    return () => {
      socket.off('match_found', handleMatchFound);
    };
  }, [socket, navigate, leaveQueue]);

  if (!inQueue && !matchData) return null;

  const gameTitle = searchingGameType === 'CONNECT_FOUR' ? 'Connect Four' : 'Tic-Tac-Toe';

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 440 }}>
        {matchData ? (
          /* Match Found State */
          <div>
            <div
              style={{
                width: 72,
                height: 72,
                margin: '0 auto 16px',
                borderRadius: '50%',
                background: 'rgba(0, 242, 254, 0.15)',
                border: '2px solid var(--neon-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(0, 242, 254, 0.5)'
              }}
            >
              <Zap size={36} color="#00f2fe" />
            </div>

            <h3
              style={{
                fontSize: '1.6rem',
                color: 'var(--text-main)',
                marginBottom: 6,
                letterSpacing: '-0.02em'
              }}
            >
              Match Found!
            </h3>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
              Entering {matchData.gameType === 'CONNECT_FOUR' ? 'Connect Four' : 'Tic-Tac-Toe'} arena...
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '14px 20px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <img
                src={matchData.opponent.avatar}
                alt={matchData.opponent.username}
                style={{ width: 44, height: 44, borderRadius: '50%', background: '#1e243a' }}
              />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>
                  {matchData.opponent.username}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--neon-gold)', fontWeight: 600 }}>
                  Rating: {matchData.opponent.rating}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Searching In Queue State */
          <div>
            <button
              onClick={leaveQueue}
              aria-label="Cancel matchmaking"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            {/* Radar Animation */}
            <div
              style={{
                position: 'relative',
                width: 120,
                height: 120,
                margin: '10px auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div className="radar-circle" style={{ width: 60, height: 60 }} />
              <div className="radar-circle" style={{ width: 100, height: 100, animationDelay: '0.7s' }} />
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                  boxShadow: '0 0 20px rgba(0, 242, 254, 0.6)'
                }}
              >
                <Swords size={28} color="#050b14" />
              </div>
            </div>

            <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: 4 }}>
              Searching for Opponent...
            </h3>

            <p style={{ color: 'var(--neon-cyan)', fontSize: '0.92rem', fontWeight: 600, marginBottom: 8 }}>
              {gameTitle} Queue
            </p>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
              Elapsed: {seconds}s
            </p>

            <button onClick={leaveQueue} className="btn btn-secondary" style={{ width: '100%' }}>
              Cancel Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
