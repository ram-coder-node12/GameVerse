// server/controllers/userController.js
const User = require('../models/User');

// @desc    Get player profile by ID
// @route   GET /api/users/:id
// @access  Public / Private
async function getUserProfile(req, res, next) {
  try {
    const user = await User.findById(req.params.id)
      .select('-passwordHash')
      .populate('friends', 'username avatar rating');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Player not found.'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Search players by username
// @route   GET /api/users/search
// @access  Private
async function searchUsers(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.status(200).json({ success: true, users: [] });
    }

    // Find users matching query (case-insensitive), excluding current logged-in user
    const users = await User.find({
      username: { $regex: q.trim(), $options: 'i' },
      _id: { $ne: req.user._id },
      isActive: true
    })
      .select('username avatar rating gamesPlayed wins')
      .limit(10);

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Update current player's avatar
// @route   PATCH /api/users/profile
// @access  Private
async function updateProfile(req, res, next) {
  try {
    const { avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (avatar) {
      user.avatar = avatar;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Get leaderboard sorted by rating
// @route   GET /api/leaderboard
// @access  Public
async function getLeaderboard(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const search = req.query.search ? req.query.search.trim() : '';

    const query = { isActive: true };
    if (search) {
      query.username = { $regex: search, $options: 'i' };
    }

    const totalPlayers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalPlayers / limit) || 1;

    const players = await User.find(query)
      .select('username avatar rating gamesPlayed wins losses draws currentStreak bestStreak')
      .sort({ rating: -1, wins: -1, gamesPlayed: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Calculate dynamic ranks
    const startRank = (page - 1) * limit + 1;
    const rankedPlayers = players.map((player, index) => ({
      ...player.toJSON(),
      rank: startRank + index
    }));

    res.status(200).json({
      success: true,
      leaderboard: rankedPlayers,
      pagination: {
        page,
        limit,
        totalPlayers,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUserProfile,
  searchUsers,
  updateProfile,
  getLeaderboard
};
