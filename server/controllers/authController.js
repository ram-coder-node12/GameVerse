// server/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

// Generate JWT token
function generateToken(userId, role) {
  return jwt.sign({ id: userId, role }, JWT_SECRET, {
    expiresIn: '7d'
  });
}

// Cookie options helper
function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
}

// @desc    Register a new player
// @route   POST /api/auth/register
// @access  Public
async function register(req, res, next) {
  try {
    const { username, email, password, role } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password.'
      });
    }

    if (username.trim().length < 3 || username.trim().length > 20) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 20 characters.'
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Username can only contain letters, numbers, and underscores.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Check duplicate username or email
    const existingUser = await User.findOne({
      $or: [
        { username: username.trim() },
        { email: email.trim().toLowerCase() }
      ]
    });

    if (existingUser) {
      const isEmail = existingUser.email === email.trim().toLowerCase();
      return res.status(409).json({
        success: false,
        message: isEmail
          ? 'An account with this email address already exists.'
          : 'This username is already taken. Please choose another.'
      });
    }

    // Hash password
    const passwordHash = await User.hashPassword(password);

    // Create user
    // Allow role override if ADMIN requested or default PLAYER
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'PLAYER';

    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: userRole
    });

    const token = generateToken(user._id, user.role);
    res.cookie('token', token, getCookieOptions());

    logger.info(`User registered successfully: ${user.username} (${user.role})`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
async function login(req, res, next) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or username and password.'
      });
    }

    const cleanIdentifier = identifier.trim();

    // Query by username OR email
    const user = await User.findOne({
      $or: [
        { username: cleanIdentifier },
        { email: cleanIdentifier.toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.'
      });
    }

    const token = generateToken(user._id, user.role);
    res.cookie('token', token, getCookieOptions());

    logger.info(`User logged in: ${user.username}`);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
}

// @desc    Log out current user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
async function logout(req, res) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
}

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private
async function getMe(req, res) {
  res.status(200).json({
    success: true,
    user: req.user
  });
}

module.exports = {
  register,
  login,
  logout,
  getMe
};
