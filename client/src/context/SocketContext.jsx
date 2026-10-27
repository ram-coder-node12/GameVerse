// client/src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8084';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('connecting'); // 'connected' | 'reconnecting' | 'disconnected'
  const [onlineCount, setOnlineCount] = useState(1);
  const [incomingChallenge, setIncomingChallenge] = useState(null);
  const [inQueue, setInQueue] = useState(false);
  const [searchingGameType, setSearchingGameType] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Create Socket.IO connection
    const newSocket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setStatus('connected');
    });

    newSocket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        newSocket.connect();
      }
      setStatus('disconnected');
    });

    newSocket.on('reconnect_attempt', () => {
      setStatus('reconnecting');
    });

    newSocket.on('reconnect', () => {
      setStatus('connected');
    });

    newSocket.on('online_count', ({ count }) => {
      setOnlineCount(count);
    });

    newSocket.on('queue_status', ({ inQueue: isQ, gameType }) => {
      setInQueue(isQ);
      setSearchingGameType(isQ ? gameType : null);
    });

    newSocket.on('challenge_received', (challenge) => {
      setIncomingChallenge(challenge);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  // Matchmaking helpers
  const joinQueue = (gameType) => {
    if (socket && user) {
      socket.emit('join_queue', {
        gameType,
        user: {
          id: user._id || user.id,
          username: user.username,
          rating: user.rating,
          avatar: user.avatar
        }
      });
      setInQueue(true);
      setSearchingGameType(gameType);
    }
  };

  const leaveQueue = () => {
    if (socket) {
      socket.emit('leave_queue', { gameType: searchingGameType });
      setInQueue(false);
      setSearchingGameType(null);
    }
  };

  // Friend challenge helpers
  const challengeFriend = (friendId, gameType) => {
    if (socket && user) {
      socket.emit('challenge_friend', {
        friendId,
        gameType,
        challenger: {
          id: user._id || user.id,
          username: user.username,
          rating: user.rating,
          avatar: user.avatar
        }
      });
    }
  };

  const respondToChallenge = (challengeId, accepted) => {
    if (socket) {
      socket.emit('challenge_response', { challengeId, accepted });
      setIncomingChallenge(null);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        status,
        onlineCount,
        inQueue,
        searchingGameType,
        joinQueue,
        leaveQueue,
        incomingChallenge,
        setIncomingChallenge,
        challengeFriend,
        respondToChallenge
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
