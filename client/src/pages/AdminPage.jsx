// client/src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Shield,
  Users,
  Gamepad2,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Flame,
  AlertTriangle
} from 'lucide-react';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [actionMessage, setActionMessage] = useState(null);

  const fetchAdminData = async (targetPage = 1, searchQuery = '') => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get(`/admin/users?page=${targetPage}&limit=10&search=${searchQuery}`)
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
      if (usersRes.data.success) {
        setUsers(usersRes.data.users || []);
        setTotalPages(usersRes.data.pagination.totalPages || 1);
        setPage(usersRes.data.pagination.page || 1);
      }
    } catch (err) {
      console.warn('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdminData(1, search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      setActionMessage(null);
      const res = await api.patch(`/admin/users/${userId}/toggle-status`);
      if (res.data.success) {
        setActionMessage({
          type: 'success',
          text: `User account has been ${!currentStatus ? 'activated' : 'deactivated'}.`
        });
        fetchAdminData(page, search);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto' }}>
      {/* Admin Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)'
          }}
        >
          <Shield size={26} color="#c084fc" />
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', color: '#fff', marginBottom: 2 }}>
            Admin Management Console
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            System-wide platform analytics, active players, and user administration
          </p>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            background: actionMessage.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${actionMessage.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            marginBottom: 20,
            color: actionMessage.type === 'error' ? '#fca5a5' : '#6ee7b7',
            fontSize: '0.9rem'
          }}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Aggregate Stats Cards */}
      {stats && (
        <div className="grid-4" style={{ marginBottom: 30 }}>
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Users
              </span>
              <Users size={18} color="#00f2fe" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
              {stats.totalUsers}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--neon-green)', marginTop: 4 }}>
              {stats.activeUsers} Active Accounts
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Games Played
              </span>
              <Gamepad2 size={18} color="#c084fc" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
              {stats.totalGames}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
              {stats.gamesToday} Played Today
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Most Popular
              </span>
              <TrendingUp size={18} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', textTransform: 'capitalize' }}>
              {stats.mostPopularGame ? stats.mostPopularGame.replace('_', ' ').toLowerCase() : 'None'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
              By Total Play Sessions
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>
                Avg Game Duration
              </span>
              <Clock size={18} color="#00e676" />
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
              {stats.averageGameDuration}s
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Server Authoritative
            </div>
          </div>
        </div>
      )}

      {/* User Management Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>Registered Users</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Manage player accounts, inspect ratings, and toggle access permissions
            </p>
          </div>

          {/* Search box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(14, 17, 28, 0.9)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 14px',
              minWidth: 260
            }}
          >
            <Search size={16} color="var(--text-dim)" />
            <input
              type="text"
              placeholder="Search user or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: '0.88rem',
                width: '100%'
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 50, textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: 50, textAlign: 'center', color: 'var(--text-dim)' }}>
            No users found matching query.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.78rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '14px 20px' }}>Player</th>
                  <th style={{ padding: '14px 20px' }}>Email</th>
                  <th style={{ padding: '14px 20px' }}>Role</th>
                  <th style={{ padding: '14px 20px' }}>Rating</th>
                  <th style={{ padding: '14px 20px' }}>Record</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u._id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      fontSize: '0.9rem'
                    }}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={u.avatar}
                          alt=""
                          style={{ width: 32, height: 32, borderRadius: '50%', background: '#1c2239' }}
                        />
                        <span style={{ fontWeight: 600, color: '#fff' }}>{u.username}</span>
                      </div>
                    </td>

                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {u.email}
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-purple' : 'badge-cyan'}`}>
                        {u.role}
                      </span>
                    </td>

                    <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--neon-gold)' }}>
                      ★ {u.rating}
                    </td>

                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                      {u.wins}W / {u.losses}L ({u.gamesPlayed} G)
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <span className={`badge ${u.isActive ? 'badge-green' : 'badge-danger'}`}>
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggleStatus(u._id, u.isActive)}
                        className={`btn ${u.isActive ? 'btn-danger' : 'btn-secondary'} btn-sm`}
                        style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                      >
                        {u.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
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
            Page {page} of {totalPages}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => fetchAdminData(page - 1, search)}
              disabled={page <= 1}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              onClick={() => fetchAdminData(page + 1, search)}
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
