// server/models/Game.js
const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema(
  {
    gameType: {
      type: String,
      required: true,
      enum: ['TIC_TAC_TOE', 'CONNECT_FOUR'],
      index: true
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    players: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        symbol: {
          type: String, // 'X', 'O', 'red', 'yellow'
          required: true
        },
        ratingBefore: {
          type: Number,
          default: 1000
        },
        ratingAfter: {
          type: Number,
          default: 1000
        },
        ratingChange: {
          type: Number,
          default: 0
        }
      }
    ],
    status: {
      type: String,
      enum: ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'],
      default: 'WAITING',
      index: true
    },
    currentTurn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    gameState: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    isDraw: {
      type: Boolean,
      default: false
    },
    result: {
      type: String,
      enum: ['IN_PROGRESS', 'WIN', 'DRAW', 'ABANDONED'],
      default: 'IN_PROGRESS',
      index: true
    },
    moves: [
      {
        player: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        moveData: mongoose.Schema.Types.Mixed,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    startedAt: {
      type: Date,
      default: Date.now
    },
    endedAt: {
      type: Date
    },
    duration: {
      type: Number, // in seconds
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast history queries
gameSchema.index({ 'players.user': 1, createdAt: -1 });
gameSchema.index({ gameType: 1, createdAt: -1 });

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;
