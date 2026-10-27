// server/config/db.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

let memoryServer = null;

async function connectDB() {
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri || mongoUri.trim() === '' || mongoUri === 'memory') {
      logger.info('No external MONGODB_URI provided. Initializing in-memory MongoDB instance for development/testing...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      mongoUri = memoryServer.getUri();
      logger.info(`In-memory MongoDB started at: ${mongoUri}`);
    }

    mongoose.set('strictQuery', false);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    logger.info(`MongoDB successfully connected to: ${mongoose.connection.host}/${mongoose.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB runtime connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected.');
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
}

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
    logger.info('MongoDB disconnected and memory server stopped.');
  } catch (error) {
    logger.error('Error disconnecting MongoDB:', error);
  }
}

module.exports = { connectDB, disconnectDB };
