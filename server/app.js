// server/app.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const gameRoutes = require('./routes/gameRoutes');
const friendRoutes = require('./routes/friendRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Allowed origins
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      // In development allow any localhost
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        return callback(null, true);
      }
      if (origin === clientUrl) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive for preview/custom domains
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Root API status endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'GameVerse Real-Time Competitive Arena API',
    status: 'ONLINE',
    version: '1.0.0',
    documentation: 'https://github.com/ram-coder-node12/GameVerse',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      games: '/api/games',
      users: '/api/users',
      friends: '/api/friends',
      admin: '/api/admin'
    }
  });
});

// Health check endpoint (Prompt Section 39)
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GameVerse server is healthy',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Mount REST routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
