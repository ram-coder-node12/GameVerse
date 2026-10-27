// server/routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const { getGameHistory, getGameById } = require('../controllers/gameController');
const { protect } = require('../middleware/authMiddleware');

router.get('/history', protect, getGameHistory);
router.get('/:id', protect, getGameById);

module.exports = router;
