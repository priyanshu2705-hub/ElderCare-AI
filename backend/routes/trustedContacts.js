const router = require('express').Router();
const { z } = require('zod');
const TrustedContact = require('../models/TrustedContact');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { phone } = require('../utils/schemas');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('elder'));

const optionalEmail = z.preprocess((v) => (v === '' ? undefined : v), z.string().trim().toLowerCase().email('Please enter a valid email.').optional());
const createSchema = z.object({
  name: z.string().trim().min(1, 'Please enter a name.').max(80),
  relationship: z.string().trim().max(40).optional(),
  phone,
  email: optionalEmail,
  emergencyContact: z.boolean().default(false),
  sharingPermissions: z.object({ receiveEmergencyAlerts: z.boolean() }).strict().optional(),
});
const updateSchema = createSchema.partial().strict();

// If a caregiver account exists with this email, link it so they can open the dashboard.
async function findCaregiverId(email) {
  if (!email) return undefined;
  const cg = await User.findOne({ email, role: 'caregiver' }).select('_id');
  return cg?._id;
}

router.get('/', asyncHandler(async (req, res) => {
  res.json({ contacts: await TrustedContact.find({ elderUserId: req.user._id }).sort({ emergencyContact: -1, createdAt: 1 }) });
}));

router.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  const count = await TrustedContact.countDocuments({ elderUserId: req.user._id });
  if (count >= 10) throw new AppError(400, 'You can add up to 10 trusted contacts.');
  const caregiverUserId = await findCaregiverId(req.body.email);
  const contact = await TrustedContact.create({ elderUserId: req.user._id, ...req.body, caregiverUserId });
  res.status(201).json({ contact });
}));

router.put('/:id', validate(updateSchema), asyncHandler(async (req, res) => {
  const update = { ...req.body };
  if ('email' in update) update.caregiverUserId = await findCaregiverId(update.email);
  const contact = await TrustedContact.findOneAndUpdate({ _id: req.params.id, elderUserId: req.user._id }, update, { new: true });
  if (!contact) throw new AppError(404, 'I could not find that contact.');
  res.json({ contact });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const c = await TrustedContact.findOneAndDelete({ _id: req.params.id, elderUserId: req.user._id });
  if (!c) throw new AppError(404, 'I could not find that contact.');
  res.json({ ok: true });
}));

module.exports = router;
