const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const env = require('../config/env');
const User = require('../models/User');
const ElderProfile = require('../models/ElderProfile');
const PrivacySettings = require('../models/PrivacySettings');
const TrustedContact = require('../models/TrustedContact');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const email = z.string().trim().toLowerCase().email('Please enter a valid email address.');
const registerSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(80),
  email,
  password: z.string().min(8, 'Your password needs at least 8 characters.').max(100),
  role: z.enum(['elder', 'caregiver']),
});
const loginSchema = z.object({ email, password: z.string().min(1, 'Please enter your password.').max(100) });

const signToken = (user) => jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

router.post('/register', authLimiter, validate(registerSchema), asyncHandler(async (req, res) => {
  const { name, email: mail, password, role } = req.body;
  if (await User.findOne({ email: mail })) throw new AppError(409, 'An account with this email already exists.');

  const user = await User.create({ name, email: mail, role, passwordHash: await bcrypt.hash(password, 10) });

  if (role === 'elder') {
    await Promise.all([ElderProfile.create({ userId: user._id }), PrivacySettings.create({ elderUserId: user._id })]);
  } else {
    // Link this caregiver to any elder who already listed this email as a trusted contact.
    // MVP note: email is not verified. For production, use an invite code or email verification.
    await TrustedContact.updateMany({ email: mail, caregiverUserId: { $exists: false } }, { caregiverUserId: user._id });
  }
  res.status(201).json({ token: signToken(user), user });
}));

router.post('/login', authLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  // Same message for unknown email and wrong password
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    throw new AppError(401, 'The email or password is not right. Please try again.');
  }
  res.json({ token: signToken(user), user });
}));

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

module.exports = router;
