const router = require('express').Router();
const { z } = require('zod');
const PrivacySettings = require('../models/PrivacySettings');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('elder'));

const updateSchema = z.object({
  shareReminders: z.boolean().optional(),
  shareAppointments: z.boolean().optional(),
  shareGrocery: z.boolean().optional(),
  shareEmergencyEvents: z.boolean().optional(),
  shareActivity: z.boolean().optional(),
  allowLocationInEmergency: z.boolean().optional(),
  // Documents are never stored, so they cannot be shared. Only `false` is accepted.
  shareDocuments: z.literal(false).optional(),
}).strict();

router.get('/', asyncHandler(async (req, res) => {
  const settings = await PrivacySettings.findOneAndUpdate({ elderUserId: req.user._id }, {}, { upsert: true, new: true, setDefaultsOnInsert: true });
  res.json({ settings });
}));

router.put('/', validate(updateSchema), asyncHandler(async (req, res) => {
  const settings = await PrivacySettings.findOneAndUpdate(
    { elderUserId: req.user._id }, { $set: { ...req.body, updatedAt: new Date() } }, { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json({ settings });
}));

module.exports = router;
