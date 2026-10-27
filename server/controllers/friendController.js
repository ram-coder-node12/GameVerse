// server/controllers/friendController.js
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

// @desc    Get user's friends list and pending requests
// @route   GET /api/friends
// @access  Private
async function getFriends(req, res, next) {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate(
      'friends',
      'username avatar rating gamesPlayed wins isActive'
    );

    const [pendingReceived, pendingSent] = await Promise.all([
      FriendRequest.find({ recipient: userId, status: 'PENDING' }).populate(
        'sender',
        'username avatar rating'
      ),
      FriendRequest.find({ sender: userId, status: 'PENDING' }).populate(
        'recipient',
        'username avatar rating'
      )
    ]);

    res.status(200).json({
      success: true,
      friends: user.friends || [],
      pendingReceived,
      pendingSent
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Send a friend request
// @route   POST /api/friends/request
// @access  Private
async function sendFriendRequest(req, res, next) {
  try {
    const { recipientId } = req.body;
    const senderId = req.user._id;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID is required.' });
    }

    if (recipientId.toString() === senderId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot send a friend request to yourself.' });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient || !recipient.isActive) {
      return res.status(404).json({ success: false, message: 'Player not found or inactive.' });
    }

    // Check if already friends
    const sender = await User.findById(senderId);
    if (sender.friends.some((f) => f.toString() === recipientId.toString())) {
      return res.status(400).json({ success: false, message: 'You are already friends with this player.' });
    }

    // Check for existing pending request in either direction
    const existingReq = await FriendRequest.findOne({
      $or: [
        { sender: senderId, recipient: recipientId, status: 'PENDING' },
        { sender: recipientId, recipient: senderId, status: 'PENDING' }
      ]
    });

    if (existingReq) {
      return res.status(409).json({
        success: false,
        message: 'A pending friend request already exists between you and this player.'
      });
    }

    const friendRequest = await FriendRequest.create({
      sender: senderId,
      recipient: recipientId,
      status: 'PENDING'
    });

    // Create persistent notification
    await Notification.create({
      user: recipientId,
      type: 'FRIEND_REQUEST',
      title: 'New Friend Request',
      message: `${req.user.username} sent you a friend request.`,
      data: {
        requestId: friendRequest._id,
        senderId,
        senderUsername: req.user.username
      }
    });

    logger.info(`Friend request sent from ${req.user.username} to ${recipient.username}`);

    res.status(201).json({
      success: true,
      message: 'Friend request sent successfully.',
      friendRequest
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Accept a friend request
// @route   POST /api/friends/:id/accept
// @access  Private
async function acceptFriendRequest(req, res, next) {
  try {
    const requestId = req.params.id;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Friend request not found.' });
    }

    if (request.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to accept this request.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status.toLowerCase()}.` });
    }

    request.status = 'ACCEPTED';
    await request.save();

    // Add friends to both users atomically
    await Promise.all([
      User.findByIdAndUpdate(userId, { $addToSet: { friends: request.sender } }),
      User.findByIdAndUpdate(request.sender, { $addToSet: { friends: userId } })
    ]);

    // Create notification for original sender
    await Notification.create({
      user: request.sender,
      type: 'FRIEND_ACCEPTED',
      title: 'Friend Request Accepted',
      message: `${req.user.username} accepted your friend request.`,
      data: {
        friendId: userId,
        friendUsername: req.user.username
      }
    });

    logger.info(`Friend request accepted between ${userId} and ${request.sender}`);

    res.status(200).json({
      success: true,
      message: 'Friend request accepted.'
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Reject a friend request
// @route   POST /api/friends/:id/reject
// @access  Private
async function rejectFriendRequest(req, res, next) {
  try {
    const requestId = req.params.id;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Friend request not found.' });
    }

    if (request.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to reject this request.' });
    }

    request.status = 'REJECTED';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Friend request rejected.'
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Remove a friend
// @route   DELETE /api/friends/:id
// @access  Private
async function removeFriend(req, res, next) {
  try {
    const friendId = req.params.id;
    const userId = req.user._id;

    await Promise.all([
      User.findByIdAndUpdate(userId, { $pull: { friends: friendId } }),
      User.findByIdAndUpdate(friendId, { $pull: { friends: userId } })
    ]);

    res.status(200).json({
      success: true,
      message: 'Friend removed successfully.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getFriends,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend
};
