// client/src/pages/FriendsPage.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import {
  Users,
  UserPlus,
  Search,
  Swords,
  Check,
  X,
  Trash2,
  AlertCircle,
  Grid3X3,
  CircleDot
} from 'lucide-react';

export default function FriendsPage() {
  const { challengeFriend } = useSocket();

  const [friends, setFriends] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const res = await api.get('/friends');
      if (res.data.success) {
        setFriends(res.data.friends || []);
        setPendingReceived(res.data.pendingReceived || []);
        setPendingSent(res.data.pendingSent || []);
      }
    } catch (err) {
      console.warn('Failed to load friends:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  // Search players debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await api.get(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.data.success) {
          setSearchResults(res.data.users || []);
        }
      } catch (err) {
        // silent
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSendRequest = async (recipientId) => {
    try {
      setMessage(null);
      const res = await api.post('/friends/request', { recipientId });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Friend request sent!' });
        fetchFriends();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleAccept = async (requestId) => {
    try {
      const res = await api.post(`/friends/${requestId}/accept`);
      if (res.data.success) {
        fetchFriends();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleReject = async (requestId) => {
    try {
      const res = await api.post(`/friends/${requestId}/reject`);
      if (res.data.success) {
        fetchFriends();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;
    try {
      const res = await api.delete(`/friends/${friendId}`);
      if (res.data.success) {
        fetchFriends();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: 4 }}>
          Friends & Challenges
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Connect with rivals, manage friend requests, and issue real-time game challenges
        </p>
      </div>

      {message && (
        <div
          style={{
            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            marginBottom: 20,
            color: message.type === 'error' ? '#fca5a5' : '#6ee7b7',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.88rem'
          }}
        >
          <AlertCircle size={18} />
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left Column: Friends List & Pending Requests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Pending Requests Received */}
          {pendingReceived.length > 0 && (
            <div className="glass-card" style={{ border: '1px solid rgba(0, 242, 254, 0.3)' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: 14 }}>
                Pending Requests ({pendingReceived.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendingReceived.map((req) => (
                  <div
                    key={req._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={req.sender.avatar}
                        alt=""
                        style={{ width: 34, height: 34, borderRadius: '50%' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {req.sender.username}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--neon-gold)' }}>
                          ★ {req.sender.rating}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleAccept(req._id)}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '6px 10px' }}
                      >
                        <Check size={14} /> Accept
                      </button>
                      <button
                        onClick={() => handleReject(req._id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 10px' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List Card */}
          <div className="glass-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16
              }}
            >
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>
                Your Friends ({friends.length})
              </h3>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading friends...
              </div>
            ) : friends.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-dim)' }}>
                <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>You haven't added any friends yet. Search for players to send requests!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {friends.map((friend) => (
                  <div
                    key={friend._id || friend.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      flexWrap: 'wrap',
                      gap: 10
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img
                        src={friend.avatar}
                        alt=""
                        style={{ width: 40, height: 40, borderRadius: '50%', background: '#1c2238' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                          {friend.username}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--neon-gold)', fontWeight: 600 }}>
                          ★ {friend.rating} • {friend.wins || 0} Wins
                        </div>
                      </div>
                    </div>

                    {/* Challenge Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        onClick={() => challengeFriend(friend._id || friend.id, 'TIC_TAC_TOE')}
                        title="Challenge to Tic-Tac-Toe"
                        className="btn btn-secondary btn-sm"
                        style={{ gap: 4 }}
                      >
                        <Grid3X3 size={14} color="#00f2fe" />
                        Duel TTT
                      </button>

                      <button
                        onClick={() => challengeFriend(friend._id || friend.id, 'CONNECT_FOUR')}
                        title="Challenge to Connect Four"
                        className="btn btn-secondary btn-sm"
                        style={{ gap: 4 }}
                      >
                        <CircleDot size={14} color="#c084fc" />
                        Duel C4
                      </button>

                      <button
                        onClick={() => handleRemoveFriend(friend._id || friend.id)}
                        title="Remove Friend"
                        aria-label="Remove Friend"
                        className="btn btn-danger btn-sm"
                        style={{ padding: 6 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Player Search & Sent Requests */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Find Players Card */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: 6 }}>
              Find Players
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
              Search registered gamers by username to send friend requests
            </p>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(14, 17, 28, 0.9)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                marginBottom: 16
              }}
            >
              <Search size={18} color="var(--text-dim)" />
              <input
                type="text"
                placeholder="Type username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-main)',
                  width: '100%',
                  fontSize: '0.92rem'
                }}
              />
            </div>

            {searching ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Searching database...
              </div>
            ) : searchResults.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {searchResults.map((u) => {
                  const isAlreadyFriend = friends.some((f) => (f._id || f.id).toString() === (u._id || u.id).toString());
                  const isPending = pendingSent.some((p) => p.recipient._id.toString() === u._id.toString());

                  return (
                    <div
                      key={u._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={u.avatar}
                          alt=""
                          style={{ width: 32, height: 32, borderRadius: '50%' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                            {u.username}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--neon-gold)' }}>
                            ★ {u.rating}
                          </div>
                        </div>
                      </div>

                      {isAlreadyFriend ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--neon-green)', fontWeight: 600 }}>
                          Friends
                        </span>
                      ) : isPending ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          Request Sent
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(u._id)}
                          className="btn btn-secondary btn-sm"
                          style={{ gap: 4, padding: '5px 10px' }}
                        >
                          <UserPlus size={14} /> Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : searchQuery.trim() ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No active players found.
              </div>
            ) : null}
          </div>

          {/* Pending Sent Requests */}
          {pendingSent.length > 0 && (
            <div className="glass-card">
              <h4 style={{ fontSize: '1rem', color: 'var(--text-main)', marginBottom: 12 }}>
                Sent Requests ({pendingSent.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingSent.map((req) => (
                  <div
                    key={req._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span>To: <strong>{req.recipient.username}</strong></span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Pending...</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
