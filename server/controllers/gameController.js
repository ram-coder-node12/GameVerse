// server/controllers/gameController.js
const Game = require('../models/Game');

// @desc    Get user's game history with pagination and filters
// @route   GET /api/games/history
// @access  Private
async function getGameHistory(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const gameType = req.query.gameType;
    const resultFilter = req.query.result; // 'WIN', 'LOSS', 'DRAW'

    const userId = req.user._id;

    // Base query: games where the user was a player and game is completed
    const query = {
      'players.user': userId,
      status: { $in: ['COMPLETED', 'ABANDONED'] }
    };

    if (gameType && ['TIC_TAC_TOE', 'CONNECT_FOUR'].includes(gameType)) {
      query.gameType = gameType;
    }

    if (resultFilter === 'WIN') {
      query.winner = userId;
    } else if (resultFilter === 'DRAW') {
      query.isDraw = true;
    } else if (resultFilter === 'LOSS') {
      query.winner = { $ne: null, $nin: [userId] };
      query.isDraw = false;
    }

    const totalGames = await Game.countDocuments(query);
    const totalPages = Math.ceil(totalGames / limit) || 1;

    const games = await Game.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('players.user', 'username avatar rating')
      .populate('winner', 'username avatar');

    // Format output with personalized user outcome
    const formattedGames = games.map((game) => {
      const currentPlayerMeta = game.players.find(
        (p) => p.user && p.user._id.toString() === userId.toString()
      );
      const opponentMeta = game.players.find(
        (p) => p.user && p.user._id.toString() !== userId.toString()
      );

      let outcome = 'DRAW';
      if (game.isDraw) {
        outcome = 'DRAW';
      } else if (game.winner && game.winner._id.toString() === userId.toString()) {
        outcome = 'WIN';
      } else if (game.winner) {
        outcome = 'LOSS';
      } else if (game.status === 'ABANDONED') {
        outcome = 'ABANDONED';
      }

      return {
        id: game._id,
        roomId: game.roomId,
        gameType: game.gameType,
        status: game.status,
        outcome,
        ratingBefore: currentPlayerMeta ? currentPlayerMeta.ratingBefore : 1000,
        ratingAfter: currentPlayerMeta ? currentPlayerMeta.ratingAfter : 1000,
        ratingChange: currentPlayerMeta ? currentPlayerMeta.ratingChange : 0,
        mySymbol: currentPlayerMeta ? currentPlayerMeta.symbol : null,
        opponent: opponentMeta && opponentMeta.user ? {
          id: opponentMeta.user._id,
          username: opponentMeta.user.username,
          avatar: opponentMeta.user.avatar,
          rating: opponentMeta.ratingBefore
        } : null,
        movesCount: game.moves ? game.moves.length : 0,
        duration: game.duration || 0,
        createdAt: game.createdAt
      };
    });

    res.status(200).json({
      success: true,
      games: formattedGames,
      pagination: {
        page,
        limit,
        totalGames,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get single game details
// @route   GET /api/games/:id
// @access  Private
async function getGameById(req, res, next) {
  try {
    const game = await Game.findById(req.params.id)
      .populate('players.user', 'username avatar rating')
      .populate('winner', 'username avatar');

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found.'
      });
    }

    res.status(200).json({
      success: true,
      game
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getGameHistory,
  getGameById
};
