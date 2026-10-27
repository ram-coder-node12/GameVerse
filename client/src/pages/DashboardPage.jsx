// client/src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import {
  Trophy,
  Flame,
  Swords,
  History,
  TrendingUp,
  Percent,
  Play,
  RotateCcw,
  Users,
  Grid3X3,
  CircleDot,
  CheckCircle2
} from 'lucide-react';

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const { joinQueue, inQueue } = useSocket();
  const navigate = useNavigate();

  const [recentGames, setRecentGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await api.get('/games/history?limit=5');
        if (res.data.success) {
          setRecentGames(res.data.games || []);
        }
      } catch (err) {
        // silent
      } finally {
        setLoadingGames(false);
      }
    };

    fetchRecent();
  }, []);

  const handleRandomizeAvatar = async () => {
    try {
      setUpdatingAvatar(true);
      const newSeed = `player_${Math.random().toString(36).substring(2, 8)}`;
      const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${newSeed}`;

      const res = await api.patch('/users/profile', { avatar: newAvatar });
      if (res.data.success) {
        updateUser({ avatar: newAvatar });
      }
    } catch (err) {
      console.warn('Failed to update avatar:', err);
    } finally {
      setUpdatingAvatar(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      {/* Profile Overview Banner Card */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 20,
          padding: '28px 32px',
          marginBottom: 28,
          background: 'linear-gradient(135deg, rgba(20, 24, 40, 0.9) 0%, rgba(12, 14, 25, 0.9) 100%)',
          border: '1px solid rgba(0, 242, 254, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative' }}>
            <img
              src={user.avatar}
              alt={user.username}
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                background: '#1a2035',
                border: '3px solid var(--neon-cyan)',
                boxShadow: '0 0 20px rgba(0, 242, 254, 0.3)'
              }}
            />
            <button
              onClick={handleRandomizeAvatar}
              disabled={updatingAvatar}
              title="Randomize Avatar"
              aria-label="Randomize Avatar"
              style={{
                position: 'absolute',
                bottom: 0,
                right: -4,
                background: '#1f293d',
                border: '1px solid var(--border-subtle)',
                color: 'var(--neon-cyan)',
                borderRadius: '50%',
                width: 26,
                height: 26,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
              }}
            >
              <RotateCcw size={13} />
            </button>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {user.username}
              </h1>
              <span className={`badge ${user.role === 'ADMIN' ? 'badge-purple' : 'badge-cyan'}`}>
                {user.role}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Member since {new Date(user.createdAt).toLocaleDateString()} • {user.email}
            </p>
          </div>
        </div>

        {/* Play Now Quick Match */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => joinQueue('TIC_TAC_TOE')}
            disabled={inQueue}
            className="btn btn-primary"
            style={{ padding: '12px 18px' }}
          >
            <Grid3X3 size={18} />
            {inQueue ? 'In Queue...' : 'Quick Tic-Tac-Toe'}
          </button>
          <button
            onClick={() => joinQueue('CONNECT_FOUR')}
            disabled={inQueue}
            className="btn btn-purple"
            style={{ padding: '12px 18px' }}
          >
            <CircleDot size={18} />
            {inQueue ? 'In Queue...' : 'Quick Connect Four'}
          </button>
        </div>
      </div>

      {/* Player Stats Grid */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {/* Rating */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Current Rating
            </span>
            <Trophy size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            {user.rating}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--neon-gold)', marginTop: 4 }}>
            Competitive ELO
          </div>
        </div>

        {/* Games Played & Wins */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Record
            </span>
            <TrendingUp size={20} color="var(--neon-cyan)" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            {user.wins}W / {user.losses}L
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {user.gamesPlayed} Total Matches ({user.draws} Draws)
          </div>
        </div>

        {/* Win Rate */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Win Rate
            </span>
            <Percent size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-heading)' }}>
            {user.winRate || 0}%
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Overall Victory Percentage
          </div>
        </div>

        {/* Win Streak */}
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Win Streak
            </span>
            <Flame size={20} color="var(--neon-pink)" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--neon-pink)', fontFamily: 'var(--font-heading)' }}>
            {user.currentStreak || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Best Streak: {user.bestStreak || 0} consecutive
          </div>
        </div>
      </div>

      {/* Recent Matches Section */}
      <div className="glass-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>Recent Battle History</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Your latest multiplayer matches and rating adjustments
            </p>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="btn btn-secondary btn-sm"
          >
            <History size={15} />
            View Full History
          </button>
        </div>

        {loadingGames ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading match history...
          </div>
        ) : recentGames.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
            <Swords size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p>No matches recorded yet. Jump into the matchmaking queue above to begin your journey!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 14px' }}>Result</th>
                  <th style={{ padding: '12px 14px' }}>Arena</th>
                  <th style={{ padding: '12px 14px' }}>Opponent</th>
                  <th style={{ padding: '12px 14px' }}>Rating Change</th>
                  <th style={{ padding: '12px 14px' }}>Duration</th>
                  <th style={{ padding: '12px 14px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentGames.map((g) => (
                  <tr
                    key={g.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      fontSize: '0.88rem'
                    }}
                  >
                    <td style={{ padding: '14px' }}>
                      <span
                        className={`badge ${
                          g.outcome === 'WIN'
                            ? 'badge-green'
                            : g.outcome === 'LOSS'
                            ? 'badge-danger'
                            : 'badge-gold'
                        }`}
                      >
                        {g.outcome}
                      </span>
                    </td>
                    <td style={{ padding: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {g.gameType === 'CONNECT_FOUR' ? 'Connect Four' : 'Tic-Tac-Toe'}
                    </td>
                    <td style={{ padding: '14px' }}>
                      {g.opponent ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <img
                            src={g.opponent.avatar}
                            alt=""
                            style={{ width: 26, height: 26, borderRadius: '50%' }}
                          />
                          <span>{g.opponent.username}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>Unknown</span>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '14px',
                        fontWeight: 700,
                        color:
                          g.ratingChange > 0
                            ? 'var(--neon-green)'
                            : g.ratingChange < 0
                            ? 'var(--neon-red)'
                            : 'var(--neon-gold)'
                      }}
                    >
                      {g.ratingChange > 0 ? `+${g.ratingChange}` : g.ratingChange}
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-muted)' }}>
                      {g.duration}s
                    </td>
                    <td style={{ padding: '14px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      {new Date(g.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
