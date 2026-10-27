// server/utils/seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Game = require('../models/Game');
const Notification = require('../models/Notification');
const logger = require('./logger');

async function seedData() {
  try {
    logger.info('Connecting to database for seeding...');
    await connectDB();

    logger.info('Clearing old records...');
    await Promise.all([
      User.deleteMany({}),
      Game.deleteMany({}),
      Notification.deleteMany({})
    ]);

    logger.info('Creating demo accounts...');
    const hashedPass = await User.hashPassword('pass123');
    const hashedAdminPass = await User.hashPassword('admin123');

    const admin = await User.create({
      username: 'AdminBoss',
      email: 'admin@gameverse.io',
      passwordHash: hashedAdminPass,
      role: 'ADMIN',
      rating: 1500,
      gamesPlayed: 10,
      wins: 8,
      losses: 2,
      draws: 0,
      currentStreak: 4,
      bestStreak: 6,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AdminBoss'
    });

    const player1 = await User.create({
      username: 'PlayerAlpha',
      email: 'alpha@gameverse.io',
      passwordHash: hashedPass,
      role: 'PLAYER',
      rating: 1250,
      gamesPlayed: 24,
      wins: 18,
      losses: 4,
      draws: 2,
      currentStreak: 3,
      bestStreak: 7,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=PlayerAlpha'
    });

    const player2 = await User.create({
      username: 'PlayerBeta',
      email: 'beta@gameverse.io',
      passwordHash: hashedPass,
      role: 'PLAYER',
      rating: 1180,
      gamesPlayed: 20,
      wins: 14,
      losses: 5,
      draws: 1,
      currentStreak: 1,
      bestStreak: 5,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=PlayerBeta'
    });

    const player3 = await User.create({
      username: 'CyberKnight',
      email: 'knight@gameverse.io',
      passwordHash: hashedPass,
      role: 'PLAYER',
      rating: 1340,
      gamesPlayed: 32,
      wins: 24,
      losses: 6,
      draws: 2,
      currentStreak: 5,
      bestStreak: 8,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberKnight'
    });

    const player4 = await User.create({
      username: 'NeonViper',
      email: 'viper@gameverse.io',
      passwordHash: hashedPass,
      role: 'PLAYER',
      rating: 1050,
      gamesPlayed: 14,
      wins: 7,
      losses: 6,
      draws: 1,
      currentStreak: 0,
      bestStreak: 3,
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=NeonViper'
    });

    // Establish friends links
    player1.friends = [player2._id, player3._id];
    player2.friends = [player1._id];
    player3.friends = [player1._id];
    await Promise.all([player1.save(), player2.save(), player3.save()]);

    // Create realistic matches
    logger.info('Creating sample match history...');
    await Game.create([
      {
        gameType: 'TIC_TAC_TOE',
        roomId: 'room_seed_ttt_01',
        players: [
          { user: player1._id, symbol: 'X', ratingBefore: 1225, ratingAfter: 1250, ratingChange: 25 },
          { user: player2._id, symbol: 'O', ratingBefore: 1200, ratingAfter: 1180, ratingChange: -20 }
        ],
        status: 'COMPLETED',
        winner: player1._id,
        isDraw: false,
        result: 'WIN',
        moves: [
          { player: player1._id, moveData: { position: 4, symbol: 'X' }, timestamp: new Date(Date.now() - 3600000) },
          { player: player2._id, moveData: { position: 0, symbol: 'O' }, timestamp: new Date(Date.now() - 3590000) },
          { player: player1._id, moveData: { position: 2, symbol: 'X' }, timestamp: new Date(Date.now() - 3580000) },
          { player: player2._id, moveData: { position: 6, symbol: 'O' }, timestamp: new Date(Date.now() - 3570000) },
          { player: player1._id, moveData: { position: 6, symbol: 'X' }, timestamp: new Date(Date.now() - 3560000) }
        ],
        gameState: { board: ['O', null, 'X', null, 'X', null, 'X', null, null] },
        duration: 48,
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        gameType: 'CONNECT_FOUR',
        roomId: 'room_seed_c4_01',
        players: [
          { user: player3._id, symbol: 'red', ratingBefore: 1315, ratingAfter: 1340, ratingChange: 25 },
          { user: player1._id, symbol: 'yellow', ratingBefore: 1245, ratingAfter: 1225, ratingChange: -20 }
        ],
        status: 'COMPLETED',
        winner: player3._id,
        isDraw: false,
        result: 'WIN',
        moves: [],
        gameState: { board: Array(6).fill(null).map(() => Array(7).fill(null)) },
        duration: 112,
        createdAt: new Date(Date.now() - 7200000)
      }
    ]);

    // Create sample notifications
    await Notification.create([
      {
        user: player1._id,
        type: 'SYSTEM',
        title: 'Welcome to GameVerse!',
        message: 'Your account is ready. Compete in Tic-Tac-Toe and Connect Four to climb the ranks.',
        read: false
      },
      {
        user: player1._id,
        type: 'GAME_RESULT',
        title: 'Match Victory!',
        message: 'You defeated PlayerBeta in Tic-Tac-Toe (+25 rating).',
        read: true
      }
    ]);

    logger.info('Database seeding completed successfully!');
    logger.info('=============================================');
    logger.info('Demo Users:');
    logger.info('1. PlayerAlpha (alpha@gameverse.io / pass123)');
    logger.info('2. PlayerBeta (beta@gameverse.io / pass123)');
    logger.info('3. AdminBoss (admin@gameverse.io / admin123) [ADMIN]');
    logger.info('=============================================');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    logger.error('Error during database seed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  seedData();
}

module.exports = seedData;
