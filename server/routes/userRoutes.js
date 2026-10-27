// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  searchUsers,
  updateProfile,
  getLeaderboard
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', protect, searchUsers);
router.patch('/profile', protect, updateProfile);
router.get('/leaderboard', getLeaderboard);
router.get('/:id', getUserProfile);

module.exports = router;
