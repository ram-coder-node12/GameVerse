// server/controllers/adminController.js
const User = require('../models/User');
const Game = require('../models/Game');

// @desc    Get aggregate platform statistics
// @route   GET /api/admin/stats
// @access  Private (ADMIN)
async function getAdminStats(req, res, next) {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      totalGames,
      gamesToday,
      popularGames,
      avgDurationResult,
      recentGames
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      Game.countDocuments({ status: { $in: ['COMPLETED', 'ABANDONED'] } }),
      Game.countDocuments({
        status: { $in: ['COMPLETED', 'ABANDONED'] },
        createdAt: { $gte: startOfToday }
      }),
      Game.aggregate([
        { $match: { status: { $in: ['COMPLETED', 'ABANDONED'] } } },
        { $group: { _id: '$gameType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Game.aggregate([
        { $match: { status: 'COMPLETED', duration: { $gt: 0 } } },
        { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
      ]),
      Game.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('players.user', 'username avatar rating')
        .populate('winner', 'username')
    ]);

    const mostPopularGame = popularGames.length > 0 ? popularGames[0]._id : 'None yet';
    const averageGameDuration = avgDurationResult.length > 0
      ? Math.round(avgDurationResult[0].avgDuration)
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalGames,
        gamesToday,
        mostPopularGame,
        gameBreakdown: popularGames,
        averageGameDuration, // in seconds
        recentGames
      }
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get list of all users with search and pagination
// @route   GET /api/admin/users
// @access  Private (ADMIN)
async function getAdminUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
    const search = req.query.search ? req.query.search.trim() : '';
    const role = req.query.role;

    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role && ['PLAYER', 'ADMIN'].includes(role)) {
      query.role = role;
    }

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit) || 1;

    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Toggle user active/disabled status
// @route   PATCH /api/admin/users/:id/toggle-status
// @access  Private (ADMIN)
async function toggleUserStatus(req, res, next) {
  try {
    const targetUserId = req.params.id;

    // Prevent self-deactivation
    if (targetUserId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own administrative account.'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: `User account has been ${targetUser.isActive ? 'activated' : 'deactivated'}.`,
      user: targetUser
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAdminStats,
  getAdminUsers,
  toggleUserStatus
};
