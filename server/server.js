// server/server.js
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./sockets/socketHandler');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 8084;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const server = http.createServer(app);

// Initialize Socket.IO attached to the same HTTP server
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        return callback(null, true);
      }
      if (origin === clientUrl) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 20000,
  pingInterval: 10000
});

// Attach socket event handlers
initSocket(io);

// Connect to Database and start server
async function startServer() {
  try {
    await connectDB();

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`===============================================`);
      logger.info(`🎮 GameVerse Server listening on port ${PORT} (0.0.0.0)`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔌 Socket.IO initialized on same HTTP port`);
      logger.info(`===============================================`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
function handleShutdown(signal) {
  logger.info(`Received ${signal}. Shutting down GameVerse gracefully...`);
  server.close(async () => {
    logger.info('HTTP & Socket.IO server closed.');
    await disconnectDB();
    process.exit(0);
  });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

startServer();

module.exports = { server, io };
