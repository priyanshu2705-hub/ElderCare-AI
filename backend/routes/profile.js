const router = require('express').Router();
const { z } = require('zod');
const ElderProfile = require('../models/ElderProfile');
const asyncHandler = require('../utils/asyncHandler');
const flatten = require('../utils/flatten');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('elder'));

const updateSchema = z.object({
  age: z.number().int().min(40).max(120).optional(),
  preferences: z.object({
    interactionMode: z.enum(['voice', 'camera', 'text']).optional(),
    language: z.string().max(10).optional(),
  }).strict().optional(),
  accessibility: z.object({
    textSize: z.enum(['large', 'xlarge', 'xxlarge']).optional(),
    highContrast: z.boolean().optional(),
    voiceSpeed: z.number().min(0.5).max(1.5).optional(),
    voiceEnabled: z.boolean().optional(),
  }).strict().optional(),
  onboardingDone: z.boolean().optional(),
}).strict();

router.get('/', asyncHandler(async (req, res) => {
  const profile = await ElderProfile.findOneAndUpdate({ userId: req.user._id }, {}, { upsert: true, new: true, setDefaultsOnInsert: true });
  res.json({ profile });
}));

router.put('/', validate(updateSchema), asyncHandler(async (req, res) => {
  const profile = await ElderProfile.findOneAndUpdate(
    { userId: req.user._id }, { $set: flatten(req.body) }, { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ profile });
}));

module.exports = router;
