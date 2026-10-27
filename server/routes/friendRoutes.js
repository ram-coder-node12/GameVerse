// server/routes/friendRoutes.js
const express = require('express');
const router = express.Router();
const {
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend
} = require('../controllers/friendController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getFriends);
router.post('/request', sendFriendRequest);
router.post('/:id/accept', acceptFriendRequest);
router.post('/:id/reject', rejectFriendRequest);
router.delete('/:id', removeFriend);

module.exports = router;
