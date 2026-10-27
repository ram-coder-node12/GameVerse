// server/services/ratingService.js
const User = require('../models/User');
const logger = require('../utils/logger');

const RATING_CHANGE = {
  WIN: 25,
  LOSS: -20,
  DRAW: 5
};

class RatingService {
  /**
   * Calculate new rating given previous rating and result
   * @param {number} currentRating
   * @param {'WIN' | 'LOSS' | 'DRAW'} result
   * @returns {{ newRating: number, change: number }}
   */
  static calculateNewRating(currentRating, result) {
    const change = RATING_CHANGE[result] || 0;
    const newRating = Math.max(0, currentRating + change);
    return {
      newRating,
      change: newRating - currentRating // accounts for floor at 0
    };
  }

  /**
   * Apply game result to both players in the database atomically
   * @param {string} winnerId - user ID of winner (or null if draw)
   * @param {string} loserId - user ID of loser (or null if draw)
   * @param {boolean} isDraw
   * @returns {Promise<Object>} Map of userId -> { ratingBefore, ratingAfter, ratingChange }
   */
  static async applyGameResult(player1Id, player2Id, winnerId, isDraw = false) {
    const resultSummary = {};

    const [player1, player2] = await Promise.all([
      User.findById(player1Id),
      User.findById(player2Id)
    ]);

    if (!player1 || !player2) {
      logger.error('Failed to find one or both players during rating update', { player1Id, player2Id });
      return resultSummary;
    }

    if (isDraw) {
      // Draw for both
      const p1Calc = this.calculateNewRating(player1.rating, 'DRAW');
      const p2Calc = this.calculateNewRating(player2.rating, 'DRAW');

      resultSummary[player1._id.toString()] = {
        ratingBefore: player1.rating,
        ratingAfter: p1Calc.newRating,
        ratingChange: p1Calc.change
      };
      resultSummary[player2._id.toString()] = {
        ratingBefore: player2.rating,
        ratingAfter: p2Calc.newRating,
        ratingChange: p2Calc.change
      };

      // Update Player 1
      player1.rating = p1Calc.newRating;
      player1.gamesPlayed += 1;
      player1.draws += 1;
      player1.currentStreak = 0;
      await player1.save();

      // Update Player 2
      player2.rating = p2Calc.newRating;
      player2.gamesPlayed += 1;
      player2.draws += 1;
      player2.currentStreak = 0;
      await player2.save();
    } else {
      const isP1Winner = player1._id.toString() === winnerId.toString();
      const winner = isP1Winner ? player1 : player2;
      const loser = isP1Winner ? player2 : player1;

      const winCalc = this.calculateNewRating(winner.rating, 'WIN');
      const lossCalc = this.calculateNewRating(loser.rating, 'LOSS');

      resultSummary[winner._id.toString()] = {
        ratingBefore: winner.rating,
        ratingAfter: winCalc.newRating,
        ratingChange: winCalc.change
      };
      resultSummary[loser._id.toString()] = {
        ratingBefore: loser.rating,
        ratingAfter: lossCalc.newRating,
        ratingChange: lossCalc.change
      };

      // Update winner
      winner.rating = winCalc.newRating;
      winner.gamesPlayed += 1;
      winner.wins += 1;
      winner.currentStreak += 1;
      if (winner.currentStreak > winner.bestStreak) {
        winner.bestStreak = winner.currentStreak;
      }
      await winner.save();

      // Update loser
      loser.rating = lossCalc.newRating;
      loser.gamesPlayed += 1;
      loser.losses += 1;
      loser.currentStreak = 0;
      await loser.save();
    }

    logger.info('Rating and statistics updated successfully', resultSummary);
    return resultSummary;
  }
}

module.exports = RatingService;
