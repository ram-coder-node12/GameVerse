// server/services/matchmakingService.js
const logger = require('../utils/logger');

class MatchmakingService {
  constructor() {
    this.queues = {
      TIC_TAC_TOE: [],
      CONNECT_FOUR: []
    };
  }

  /**
   * Add a player to the matchmaking queue
   * @param {string} gameType
   * @param {string} socketId
   * @param {Object} user
   * @returns {{ matched: boolean, match?: Object }}
   */
  joinQueue(gameType, socketId, user) {
    if (!this.queues[gameType]) {
      this.queues[gameType] = [];
    }

    const userId = (user.id || user._id || '').toString();

    // Remove any existing occurrences in all queues first
    this.leaveQueueAll(userId, socketId);

    const queue = this.queues[gameType];

    logger.info(`Player ${user.username} joined ${gameType} queue. Current size before push: ${queue.length}`);

    // If another player is waiting in this queue, create a match!
    if (queue.length > 0) {
      const opponent = queue.shift(); // FIFO matching

      // Safety check: ensure opponent is not the same user
      if (opponent.user.id.toString() === userId) {
        queue.push({
          socketId,
          user: { id: userId, username: user.username, rating: user.rating, avatar: user.avatar },
          joinedAt: Date.now()
        });
        return { matched: false };
      }

      const roomId = `room_${gameType.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      logger.info(`Match created for ${gameType}: ${opponent.user.username} vs ${user.username} in ${roomId}`);

      return {
        matched: true,
        match: {
          roomId,
          gameType,
          player1: opponent,
          player2: {
            socketId,
            user: {
              id: userId,
              username: user.username,
              rating: user.rating,
              avatar: user.avatar
            }
          }
        }
      };
    }

    // Otherwise, place player in queue
    queue.push({
      socketId,
      user: {
        id: userId,
        username: user.username,
        rating: user.rating,
        avatar: user.avatar
      },
      joinedAt: Date.now()
    });

    return { matched: false };
  }

  /**
   * Remove a player from a specific game queue
   */
  leaveQueue(gameType, userId, socketId) {
    if (!this.queues[gameType]) return false;
    const initialLen = this.queues[gameType].length;
    this.queues[gameType] = this.queues[gameType].filter((entry) => {
      const matchUser = userId && entry.user.id.toString() === userId.toString();
      const matchSocket = socketId && entry.socketId === socketId;
      return !matchUser && !matchSocket;
    });
    return this.queues[gameType].length < initialLen;
  }

  /**
   * Remove a player from all queues (e.g. on disconnect or match found)
   */
  leaveQueueAll(userId, socketId) {
    let removed = false;
    for (const gameType of Object.keys(this.queues)) {
      if (this.leaveQueue(gameType, userId, socketId)) {
        removed = true;
      }
    }
    return removed;
  }

  /**
   * Get queue length
   */
  getQueueCount(gameType) {
    return this.queues[gameType] ? this.queues[gameType].length : 0;
  }

  /**
   * Check if user is currently searching
   */
  isInQueue(userId) {
    for (const gameType of Object.keys(this.queues)) {
      if (this.queues[gameType].some((e) => e.user.id.toString() === userId.toString())) {
        return gameType;
      }
    }
    return null;
  }
}

module.exports = new MatchmakingService();
