// client/src/pages/LeaderboardPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Trophy, Search, ChevronLeft, ChevronRight, Medal } from 'lucide-react';

export default function LeaderboardPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [search, setSearch] = useState('');

  const fetchLeaderboard = async (targetPage = 1, searchQuery = '') => {
    try {
      setLoading(true);
      const res = await api.get(`/users/leaderboard?page=${targetPage}&limit=10&search=${searchQuery}`);
      if (res.data.success) {
        setPlayers(res.data.leaderboard || []);
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalPlayers(res.data.pagination.totalPlayers || 0);
        setPage(res.data.pagination.page || 1);
      }
    } catch (err) {
      console.warn('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchLeaderboard(1, search);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchLeaderboard(newPage, search);
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '2px solid var(--neon-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 0 25px rgba(245, 158, 11, 0.4)'
          }}
        >
          <Trophy size={28} color="#f59e0b" />
        </div>
        <h1 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: 6 }}>
          Global Leaderboard
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Ranked standings of top competitive players across GameVerse
        </p>
      </div>

      {/* Search Input Bar */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 20px',
          marginBottom: 20
        }}
      >
        <Search size={18} color="var(--text-dim)" />
        <input
          type="text"
          placeholder="Search players by username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: '0.95rem',
            width: '100%',
            fontFamily: 'var(--font-body)'
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Leaderboard Table Card */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading rankings...
          </div>
        ) : players.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-dim)' }}>
            No players found matching your search.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '16px 20px', width: 80 }}>Rank</th>
                  <th style={{ padding: '16px 20px' }}>Player</th>
                  <th style={{ padding: '16px 20px' }}>Rating</th>
                  <th style={{ padding: '16px 20px' }}>Matches</th>
                  <th style={{ padding: '16px 20px' }}>Wins</th>
                  <th style={{ padding: '16px 20px' }}>Win Rate</th>
                  <th style={{ padding: '16px 20px' }}>Streak</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => {
                  const isTop1 = player.rank === 1;
                  const isTop2 = player.rank === 2;
                  const isTop3 = player.rank === 3;

                  return (
                    <tr
                      key={player._id || player.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        background: isTop1
                          ? 'rgba(245, 158, 11, 0.06)'
                          : isTop2
                          ? 'rgba(229, 231, 235, 0.04)'
                          : isTop3
                          ? 'rgba(205, 127, 50, 0.04)'
                          : 'transparent',
                        fontSize: '0.92rem'
                      }}
                    >
                      {/* Rank Column */}
                      <td style={{ padding: '16px 20px', fontWeight: 800 }}>
                        {isTop1 ? (
                          <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                            🥇 #1
                          </span>
                        ) : isTop2 ? (
                          <span style={{ color: '#e5e7eb', display: 'flex', alignItems: 'center', gap: 4 }}>
                            🥈 #2
                          </span>
                        ) : isTop3 ? (
                          <span style={{ color: '#cd7f32', display: 'flex', alignItems: 'center', gap: 4 }}>
                            🥉 #3
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>#{player.rank}</span>
                        )}
                      </td>

                      {/* Player Profile */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <img
                            src={player.avatar}
                            alt=""
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: '#192038',
                              border: isTop1 ? '2px solid #f59e0b' : '1px solid var(--border-subtle)'
                            }}
                          />
                          <span style={{ fontWeight: 700, color: '#fff' }}>
                            {player.username}
                          </span>
                        </div>
                      </td>

                      {/* Rating */}
                      <td style={{ padding: '16px 20px', fontWeight: 800, color: 'var(--neon-gold)', fontFamily: 'var(--font-heading)' }}>
                        ★ {player.rating}
                      </td>

                      {/* Total Games */}
                      <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>
                        {player.gamesPlayed || 0}
                      </td>

                      {/* Wins */}
                      <td style={{ padding: '16px 20px', color: 'var(--neon-green)', fontWeight: 600 }}>
                        {player.wins || 0}
                      </td>

                      {/* Win Rate */}
                      <td style={{ padding: '16px 20px' }}>
                        <span className="badge badge-green">
                          {player.winRate || 0}%
                        </span>
                      </td>

                      {/* Current Streak */}
                      <td style={{ padding: '16px 20px', color: '#f82572', fontWeight: 700 }}>
                        🔥 {player.currentStreak || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(255, 255, 255, 0.02)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}
        >
          <div>
            Showing page {page} of {totalPages} ({totalPlayers} players registered)
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages}
              className="btn btn-secondary btn-sm"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
