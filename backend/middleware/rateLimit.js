const rateLimit = require('express-rate-limit');

const make = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message } },
  });

module.exports = {
  authLimiter: make(15 * 60 * 1000, 30, 'Too many sign-in attempts. Please wait a few minutes and try again.'),
  aiLimiter: make(60 * 1000, 30, 'You are asking very quickly. Please wait a moment and try again.'),
};
