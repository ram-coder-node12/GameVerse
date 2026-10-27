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
  LayoutDashboard,
  Sun,
  Moon,
  Menu,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { status, onlineCount } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notifRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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
    <header className="app-header">
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
              width: 32,
              height: 32,
              borderRadius: 4,
              background: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Gamepad2 size={19} color="var(--bg-primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '1.35rem',
                letterSpacing: '-0.03em',
                color: 'var(--text-main)',
                lineHeight: 1
              }}
            >
              GameVerse
            </span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '2px 6px',
                borderRadius: 3,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                lineHeight: 1
              }}
            >
              ARENA
            </span>
          </div>
        </Link>

        {/* Center Navigation Links (Render Developer Style) */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 4,
              fontSize: '0.88rem',
              fontWeight: isActive('/') ? 600 : 500,
              color: isActive('/') ? 'var(--text-main)' : 'var(--text-muted)',
              background: isActive('/') ? 'var(--bg-secondary)' : 'transparent',
              border: isActive('/') ? '1px solid var(--border-subtle)' : '1px solid transparent',
              transition: 'all 0.15s'
            }}
          >
            Lobby
          </Link>

          {user && (
            <Link
              to="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: '0.88rem',
                fontWeight: isActive('/dashboard') ? 600 : 500,
                color: isActive('/dashboard') ? 'var(--text-main)' : 'var(--text-muted)',
                background: isActive('/dashboard') ? 'var(--bg-secondary)' : 'transparent',
                border: isActive('/dashboard') ? '1px solid var(--border-subtle)' : '1px solid transparent',
                transition: 'all 0.15s'
              }}
            >
              Dashboard
            </Link>
          )}

          <Link
            to="/leaderboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 4,
              fontSize: '0.88rem',
              fontWeight: isActive('/leaderboard') ? 600 : 500,
              color: isActive('/leaderboard') ? 'var(--text-main)' : 'var(--text-muted)',
              background: isActive('/leaderboard') ? 'var(--bg-secondary)' : 'transparent',
              border: isActive('/leaderboard') ? '1px solid var(--border-subtle)' : '1px solid transparent',
              transition: 'all 0.15s'
            }}
          >
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
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: '0.88rem',
                  fontWeight: isActive('/history') ? 600 : 500,
                  color: isActive('/history') ? 'var(--text-main)' : 'var(--text-muted)',
                  background: isActive('/history') ? 'var(--bg-secondary)' : 'transparent',
                  border: isActive('/history') ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  transition: 'all 0.15s'
                }}
              >
                History
              </Link>

              <Link
                to="/friends"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 4,
                  fontSize: '0.88rem',
                  fontWeight: isActive('/friends') ? 600 : 500,
                  color: isActive('/friends') ? 'var(--text-main)' : 'var(--text-muted)',
                  background: isActive('/friends') ? 'var(--bg-secondary)' : 'transparent',
                  border: isActive('/friends') ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  transition: 'all 0.15s'
                }}
              >
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
                padding: '6px 12px',
                borderRadius: 4,
                fontSize: '0.88rem',
                fontWeight: 600,
                color: 'var(--render-purple)',
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.2)',
                transition: 'all 0.15s'
              }}
            >
              <Shield size={14} />
              Admin
            </Link>
          )}
        </nav>

        {/* Right Action Icons / User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Live Connection & Online Count Pill */}
          <div
            className="mobile-hide-sm"
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
            <span style={{ color: 'var(--neon-cyan)', fontWeight: 600 }}>{onlineCount} Online</span>
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
                    color: showNotifs ? 'var(--neon-cyan)' : 'var(--text-main)',
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
                        boxShadow: '0 2px 6px rgba(244, 63, 94, 0.35)'
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
                      width: 300,
                      maxWidth: '90vw',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-card)',
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
                            color: 'var(--neon-cyan)',
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
                              background: n.read ? 'transparent' : 'rgba(56, 189, 248, 0.06)'
                            }}
                          >
                            <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: 2 }}>
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
                className="mobile-hide-sm"
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

              {/* Render-style Solid Black Dashboard Button */}
              <Link to="/dashboard" className="btn btn-primary btn-sm mobile-hide-sm">
                Dashboard
              </Link>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                title="Log Out"
                className="btn btn-secondary btn-sm mobile-hide-sm"
                style={{ padding: '7px 9px' }}
              >
                <LogOut size={15} />
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="mobile-hide-sm">
              <Link
                to="/login"
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  transition: 'color 0.15s'
                }}
              >
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle Navigation Menu"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: 8,
              color: 'var(--text-main)',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Collapsible Mobile Navigation Drawer */}
      {mobileOpen && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            animation: 'slideDown 0.2s ease-out'
          }}
        >
          {user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.04)',
                marginBottom: 6
              }}
            >
              <img
                src={user.avatar}
                alt={user.username}
                style={{ width: 38, height: 38, borderRadius: '50%', background: '#1c2237' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {user.username}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--neon-gold)', fontWeight: 600 }}>
                  ★ {user.rating} ELO • {user.role}
                </div>
              </div>
            </div>
          )}

          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: isActive('/') ? 'var(--neon-cyan)' : 'var(--text-main)',
              background: isActive('/') ? 'rgba(56, 189, 248, 0.1)' : 'transparent'
            }}
          >
            <Gamepad2 size={18} />
            Lobby
          </Link>

          {user && (
            <Link
              to="/dashboard"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: isActive('/dashboard') ? 'var(--neon-cyan)' : 'var(--text-main)',
                background: isActive('/dashboard') ? 'rgba(56, 189, 248, 0.1)' : 'transparent'
              }}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
          )}

          <Link
            to="/leaderboard"
            onClick={() => setMobileOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: isActive('/leaderboard') ? 'var(--neon-cyan)' : 'var(--text-main)',
              background: isActive('/leaderboard') ? 'rgba(56, 189, 248, 0.1)' : 'transparent'
            }}
          >
            <Trophy size={18} />
            Leaderboard
          </Link>

          {user && (
            <>
              <Link
                to="/history"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: isActive('/history') ? 'var(--neon-cyan)' : 'var(--text-main)',
                  background: isActive('/history') ? 'rgba(56, 189, 248, 0.1)' : 'transparent'
                }}
              >
                <History size={18} />
                History
              </Link>

              <Link
                to="/friends"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: isActive('/friends') ? 'var(--neon-cyan)' : 'var(--text-main)',
                  background: isActive('/friends') ? 'rgba(56, 189, 248, 0.1)' : 'transparent'
                }}
              >
                <Users size={18} />
                Friends
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: isActive('/admin') ? '#c084fc' : '#a855f7',
                background: isActive('/admin') ? 'rgba(168, 85, 247, 0.12)' : 'transparent'
              }}
            >
              <Shield size={18} />
              Admin Panel
            </Link>
          )}

          {user ? (
            <button
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              className="btn btn-danger btn-sm"
              style={{ width: '100%', marginTop: 8, padding: '10px 14px', justifyContent: 'center' }}
            >
              <LogOut size={16} />
              Log Out
            </button>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="btn btn-secondary btn-sm"
                style={{ justifyContent: 'center', padding: '10px 14px' }}
              >
                <LogIn size={16} />
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="btn btn-primary btn-sm"
                style={{ justifyContent: 'center', padding: '10px 14px' }}
              >
                <UserPlus size={16} />
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
