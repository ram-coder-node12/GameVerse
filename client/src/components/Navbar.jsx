// client/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Gamepad2,
  Trophy,
  History,
  Users,
  Shield,
  Bell,
  LogOut,
  LogIn,
  UserPlus,
  Flame,
  LayoutDashboard
} from 'lucide-react';
import api from '../services/api';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { status, onlineCount } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);

  // Fetch notifications if logged in
  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data.success) {
          setNotifications(res.data.notifications || []);
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (err) {
        // silent catch
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {}
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header
      style={{
        background: 'rgba(13, 16, 27, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 20px',
          height: 68,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(0, 242, 254, 0.4)'
            }}
          >
            <Gamepad2 size={24} color="#050b14" />
          </div>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.45rem',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 40%, #00f2fe 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            GameVerse
          </span>
        </Link>

        {/* Center Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="desktop-nav">
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: isActive('/') ? '#00f2fe' : 'var(--text-muted)',
              background: isActive('/') ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
              transition: 'all 0.2s'
            }}
          >
            <Gamepad2 size={16} />
            Lobby
          </Link>

          {user && (
            <Link
              to="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: isActive('/dashboard') ? '#00f2fe' : 'var(--text-muted)',
                background: isActive('/dashboard') ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
                transition: 'all 0.2s'
              }}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          )}

          <Link
            to="/leaderboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: isActive('/leaderboard') ? '#00f2fe' : 'var(--text-muted)',
              background: isActive('/leaderboard') ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
              transition: 'all 0.2s'
            }}
          >
            <Trophy size={16} />
            Leaderboard
          </Link>

          {user && (
            <>
              <Link
                to="/history"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive('/history') ? '#00f2fe' : 'var(--text-muted)',
                  background: isActive('/history') ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                <History size={16} />
                History
              </Link>

              <Link
                to="/friends"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: isActive('/friends') ? '#00f2fe' : 'var(--text-muted)',
                  background: isActive('/friends') ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                <Users size={16} />
                Friends
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: isActive('/admin') ? '#c084fc' : '#a855f7',
                background: isActive('/admin') ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              <Shield size={16} />
              Admin
            </Link>
          )}
        </nav>

        {/* Right Action Icons / User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Live Connection & Online Count Pill */}
          <div
            title={`Real-Time Connection: ${status}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)'
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background:
                  status === 'connected'
                    ? '#10b981'
                    : status === 'reconnecting'
                    ? '#f59e0b'
                    : '#ef4444',
                boxShadow:
                  status === 'connected'
                    ? '0 0 8px #10b981'
                    : status === 'reconnecting'
                    ? '0 0 8px #f59e0b'
                    : '0 0 8px #ef4444'
              }}
            />
            <span style={{ textTransform: 'capitalize' }}>{status}</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span style={{ color: '#00f2fe', fontWeight: 600 }}>{onlineCount} Online</span>
          </div>

          {user ? (
            <>
              {/* Notifications Bell */}
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  aria-label="Notifications"
                  style={{
                    position: 'relative',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    padding: 8,
                    color: showNotifs ? '#00f2fe' : 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        background: 'var(--neon-pink)',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        borderRadius: '50%',
                        width: 17,
                        height: 17,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 8px rgba(248, 37, 114, 0.6)'
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifs && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 12px)',
                      width: 320,
                      background: '#151828',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
                      overflow: 'hidden',
                      zIndex: 100
                    }}
                  >
                    <div
                      style={{
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid var(--border-subtle)'
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#00f2fe',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                              background: n.read ? 'transparent' : 'rgba(0, 242, 254, 0.04)'
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#fff', marginBottom: 2 }}>
                              {n.title}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{n.message}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 4 }}>
                              {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Player Profile Chip */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '4px 10px 4px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <img
                  src={user.avatar}
                  alt={user.username}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: '#1c2237' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.2 }}>
                    {user.username}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--neon-gold)', fontWeight: 600 }}>
                    ★ {user.rating}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title="Log Out"
                className="btn btn-secondary btn-sm"
                style={{ padding: '8px 10px' }}
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={15} />
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={15} />
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
