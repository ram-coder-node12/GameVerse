// client/src/components/ChallengeModal.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { Swords, Check, X } from 'lucide-react';

export default function ChallengeModal() {
  const { incomingChallenge, respondToChallenge, socket } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    const handleChallengeAccepted = ({ roomId, gameType }) => {
      navigate(`/game/${roomId}`);
    };

    socket.on('challenge_accepted', handleChallengeAccepted);

    return () => {
      socket.off('challenge_accepted', handleChallengeAccepted);
    };
  }, [socket, navigate]);

  if (!incomingChallenge) return null;

  const { challengeId, challenger, gameType } = incomingChallenge;
  const gameTitle = gameType === 'CONNECT_FOUR' ? 'Connect Four' : 'Tic-Tac-Toe';

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 420 }}>
        <div
          style={{
            width: 60,
            height: 60,
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.12)',
            border: '2px solid var(--neon-purple)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow-purple)'
          }}
        >
          <Swords size={30} color="var(--neon-purple)" />
        </div>

        <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: 4 }}>
          Friend Challenge!
        </h3>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
          <strong style={{ color: 'var(--text-main)' }}>{challenger.username}</strong> has challenged you to a game of{' '}
          <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>{gameTitle}</span>!
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 24
          }}
        >
          <img
            src={challenger.avatar}
            alt={challenger.username}
            style={{ width: 44, height: 44, borderRadius: '50%', background: '#1c2136' }}
          />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{challenger.username}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--neon-gold)' }}>
              Rating: {challenger.rating}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => respondToChallenge(challengeId, false)}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            <X size={18} />
            Decline
          </button>
          <button
            onClick={() => respondToChallenge(challengeId, true)}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            <Check size={18} />
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
