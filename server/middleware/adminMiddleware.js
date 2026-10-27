// server/middleware/adminMiddleware.js

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access forbidden. Administrator privileges required.'
    });
  }
  next();
}

module.exports = { requireAdmin };
