// client/src/pages/HomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Gamepad2,
  Swords,
  ShieldCheck,
  Zap,
  Trophy,
  Users,
  Grid3X3,
  CircleDot
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const { joinQueue, inQueue } = useSocket();
  const navigate = useNavigate();

  const handlePlayOnline = (gameType) => {
    if (!user) {
      navigate('/login');
      return;
    }
    joinQueue(gameType);
  };

  return (
    <div>
      {/* Hero Header */}
      <section style={{ textAlign: 'center', padding: '50px 20px 40px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(0, 242, 254, 0.08)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            marginBottom: 20
          }}
        >
          <Zap size={15} color="#00f2fe" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#00f2fe' }}>
            Real-Time Server-Authoritative Browser Gaming
          </span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            marginBottom: 16
          }}
        >
          Master the Arena in{' '}
          <span className="text-gradient-cyan">GameVerse</span>
        </h1>

        <p
          style={{
            color: 'var(--text-muted)',
            fontSize: '1.15rem',
            maxWidth: 620,
            margin: '0 auto 36px',
            lineHeight: 1.6
          }}
        >
          Compete in high-stakes, server-validated multiplayer games. Climb the global leaderboard, challenge friends, and track your competitive rating in real time.
        </p>

        {!user && (
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
            <button onClick={() => navigate('/register')} className="btn btn-primary btn-lg">
              Create Free Account
            </button>
            <button onClick={() => navigate('/login')} className="btn btn-secondary btn-lg">
              Sign In
            </button>
          </div>
        )}
      </section>

      {/* Game Selection Arena Cards */}
      <section style={{ marginBottom: 60 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: 6 }}>
            Featured Arenas
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Select a game mode to instantly enter the real-time matchmaking queue.
          </p>
        </div>

        <div className="grid-2">
          {/* Tic-Tac-Toe Card */}
          <div
            className="glass-card"
            style={{
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '1px solid rgba(0, 242, 254, 0.2)'
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(0, 242, 254, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Grid3X3 size={26} color="#00f2fe" />
                </div>
                <span className="badge badge-cyan">2 Players • Fast</span>
              </div>

              <h3 style={{ fontSize: '1.45rem', color: '#fff', marginBottom: 8 }}>
                Tic-Tac-Toe Arena
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: 20 }}>
                The classic 3×3 tactical duel. Place your mark, anticipate your opponent's moves, and claim three in a row. Authoritative move validation with instant rematch.
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  marginBottom: 24,
                  fontSize: '0.82rem'
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Win Rating: </span>
                  <strong style={{ color: 'var(--neon-green)' }}>+25 PTS</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Loss: </span>
                  <strong style={{ color: 'var(--neon-red)' }}>-20 PTS</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Draw: </span>
                  <strong style={{ color: 'var(--neon-gold)' }}>+5 PTS</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePlayOnline('TIC_TAC_TOE')}
              disabled={inQueue}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px' }}
            >
              <Swords size={18} />
              {inQueue ? 'In Queue...' : 'Play Tic-Tac-Toe Online'}
            </button>
          </div>

          {/* Connect Four Card */}
          <div
            className="glass-card"
            style={{
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '1px solid rgba(138, 43, 226, 0.3)'
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(138, 43, 226, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <CircleDot size={26} color="#c084fc" />
                </div>
                <span className="badge badge-purple">7×6 Grid • Tactical</span>
              </div>

              <h3 style={{ fontSize: '1.45rem', color: '#fff', marginBottom: 8 }}>
                Connect Four Arena
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: 20 }}>
                Drop colored disks into the 7-column gravity vertical grid. Connect 4 disks horizontally, vertically, or diagonally before your opponent blocks your path.
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.03)',
                  marginBottom: 24,
                  fontSize: '0.82rem'
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Win Rating: </span>
                  <strong style={{ color: 'var(--neon-green)' }}>+25 PTS</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Loss: </span>
                  <strong style={{ color: 'var(--neon-red)' }}>-20 PTS</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)' }}>Draw: </span>
                  <strong style={{ color: 'var(--neon-gold)' }}>+5 PTS</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => handlePlayOnline('CONNECT_FOUR')}
              disabled={inQueue}
              className="btn btn-purple"
              style={{ width: '100%', padding: '14px' }}
            >
              <Swords size={18} />
              {inQueue ? 'In Queue...' : 'Play Connect Four Online'}
            </button>
          </div>
        </div>
      </section>

      {/* Engineering Pillars */}
      <section style={{ marginBottom: 40 }}>
        <div className="grid-3">
          <div className="glass-card">
            <div style={{ color: '#00f2fe', marginBottom: 12 }}>
              <ShieldCheck size={28} />
            </div>
            <h4 style={{ color: '#fff', fontSize: '1.15rem', marginBottom: 8 }}>
              Server-Authoritative Engine
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Clients never decide moves, turn legality, or game results. Every action is strictly validated on the backend.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ color: '#a855f7', marginBottom: 12 }}>
              <Zap size={28} />
            </div>
            <h4 style={{ color: '#fff', fontSize: '1.15rem', marginBottom: 8 }}>
              Zero-Polling Socket.IO
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Instant bi-directional state synchronization, automated matchmaking queues, live friend invites, and 30s disconnect resilience.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ color: '#f59e0b', marginBottom: 12 }}>
              <Trophy size={28} />
            </div>
            <h4 style={{ color: '#fff', fontSize: '1.15rem', marginBottom: 8 }}>
              Competitive Rating System
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Persistent skill ratings starting at 1000, dynamic streaks, match histories, and a real-time global leaderboard.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
