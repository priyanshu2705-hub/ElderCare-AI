const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');

async function authenticate(req, _res, next) {
  try {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new AppError(401, 'Please sign in to continue.');

    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      throw new AppError(401, 'Your session has ended. Please sign in again.');
    }

    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user) throw new AppError(401, 'Please sign in to continue.');
    req.user = user;

    // Track "last active" for elders (at most once a minute)
    if (user.role === 'elder' && (!user.lastActiveAt || Date.now() - user.lastActiveAt.getTime() > 60000)) {
      User.updateOne({ _id: user._id }, { lastActiveAt: new Date() }).catch(() => {});
    }
    next();
  } catch (e) {
    next(e);
  }
}

const requireRole = (...roles) => (req, _res, next) =>
  roles.includes(req.user.role) ? next() : next(new AppError(403, "You don't have permission to do that."));

module.exports = { authenticate, requireRole };
