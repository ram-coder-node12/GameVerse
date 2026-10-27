// client/src/pages/HistoryPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { History, Filter, ChevronLeft, ChevronRight, Swords, Clock } from 'lucide-react';

export default function HistoryPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGames, setTotalGames] = useState(0);
  const [gameTypeFilter, setGameTypeFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');

  const fetchHistory = async (targetPage = 1, gType = gameTypeFilter, resF = resultFilter) => {
    try {
      setLoading(true);
      let query = `?page=${targetPage}&limit=10`;
      if (gType) query += `&gameType=${gType}`;
      if (resF) query += `&result=${resF}`;

      const res = await api.get(`/games/history${query}`);
      if (res.data.success) {
        setGames(res.data.games || []);
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalGames(res.data.pagination.totalGames || 0);
        setPage(res.data.pagination.page || 1);
      }
    } catch (err) {
      console.warn('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1, gameTypeFilter, resultFilter);
  }, [gameTypeFilter, resultFilter]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchHistory(newPage);
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: 4 }}>
            Match History
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Browse through your complete record of competitive multiplayer games
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-input"
            value={gameTypeFilter}
            onChange={(e) => setGameTypeFilter(e.target.value)}
            style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="">All Arenas</option>
            <option value="TIC_TAC_TOE">Tic-Tac-Toe</option>
            <option value="CONNECT_FOUR">Connect Four</option>
          </select>

          <select
            className="form-input"
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }}
          >
            <option value="">All Outcomes</option>
            <option value="WIN">Victories</option>
            <option value="LOSS">Defeats</option>
            <option value="DRAW">Draws</option>
          </select>
        </div>
      </div>

      {/* History Table Card */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading match records...
          </div>
        ) : games.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-dim)' }}>
            <Swords size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p>No games found matching your current filter criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 620 }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '16px 20px' }}>Outcome</th>
                  <th style={{ padding: '16px 20px' }}>Arena</th>
                  <th style={{ padding: '16px 20px' }}>Opponent</th>
                  <th style={{ padding: '16px 20px' }}>Rating Change</th>
                  <th style={{ padding: '16px 20px' }}>Moves</th>
                  <th style={{ padding: '16px 20px' }}>Duration</th>
                  <th style={{ padding: '16px 20px' }}>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {games.map((g) => (
                  <tr
                    key={g.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      fontSize: '0.9rem'
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
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

                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {g.gameType === 'CONNECT_FOUR' ? 'Connect Four' : 'Tic-Tac-Toe'}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      {g.opponent ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img
                            src={g.opponent.avatar}
                            alt=""
                            style={{ width: 28, height: 28, borderRadius: '50%', background: '#1c2136' }}
                          />
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{g.opponent.username}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--neon-gold)', marginLeft: 6 }}>
                              ★ {g.opponent.rating}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>Unknown</span>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px', fontWeight: 700 }}>
                      <span
                        style={{
                          color:
                            g.ratingChange > 0
                              ? 'var(--neon-green)'
                              : g.ratingChange < 0
                              ? 'var(--neon-red)'
                              : 'var(--neon-gold)'
                        }}
                      >
                        {g.ratingChange > 0 ? `+${g.ratingChange}` : g.ratingChange}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginLeft: 6 }}>
                        ({g.ratingAfter})
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>
                      {g.movesCount}
                    </td>

                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>
                      {g.duration}s
                    </td>

                    <td style={{ padding: '16px 20px', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      {new Date(g.createdAt).toLocaleDateString()} {new Date(g.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
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
            Showing page {page} of {totalPages} ({totalGames} total matches)
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
