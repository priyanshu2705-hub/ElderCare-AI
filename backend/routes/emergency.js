const router = require('express').Router();
const { z } = require('zod');
const EmergencyEvent = require('../models/EmergencyEvent');
const TrustedContact = require('../models/TrustedContact');
const PrivacySettings = require('../models/PrivacySettings');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const { executeTool } = require('../services/toolExecutor');

router.use(authenticate, requireRole('elder'));

const triggerSchema = z.object({ triggerType: z.enum(['button', 'voice', 'text']).default('button') });
const updateSchema = z.object({
  status: z.enum(['active', 'resolved', 'cancelled']).optional(),
  locationShared: z.boolean().optional(),
  location: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), accuracy: z.number().optional() }).optional(),
}).strict().refine((b) => !b.locationShared || b.location, { message: 'Location is missing.' });

// Called only AFTER the elder confirms "Are you in immediate danger? YES".
router.post('/trigger', validate(triggerSchema), asyncHandler(async (req, res) => {
  const result = await executeTool('triggerEmergencyMode', req.body, { userId: req.user._id });
  const [contacts, settings] = await Promise.all([
    TrustedContact.find({ elderUserId: req.user._id }).sort({ emergencyContact: -1 }),
    PrivacySettings.findOne({ elderUserId: req.user._id }),
  ]);
  const visible = settings ? settings.shareEmergencyEvents : true;
  res.status(201).json({
    event: result.data,
    contacts: contacts.map((c) => ({ id: c._id, name: c.name, relationship: c.relationship, phone: c.phone, emergencyContact: c.emergencyContact })),
    emergencyNumbers: { national: '112', ambulance: '108' },
    sharedWithFamily: visible,
    contactNotified: false,
    // Honest status: nothing is sent automatically by this MVP.
    notice: visible
      ? 'Demo: your help request was saved and your family can see it on their dashboard. No SMS or phone call was sent automatically. Please call someone now.'
      : 'Your help request was saved for you only, because sharing emergency alerts is turned off. No SMS or phone call was sent. Please call someone now.',
  });
}));

router.get('/', asyncHandler(async (req, res) => {
  res.json({ events: await EmergencyEvent.find({ elderUserId: req.user._id }).sort({ timestamp: -1 }).limit(20) });
}));

// Attach location (only after the elder taps "Share my location") or close the event.
router.put('/:id', validate(updateSchema), asyncHandler(async (req, res) => {
  const update = { ...req.body };
  if (update.locationShared === false) update.location = undefined;
  const event = await EmergencyEvent.findOneAndUpdate({ _id: req.params.id, elderUserId: req.user._id }, update, { new: true });
  if (!event) throw new AppError(404, 'I could not find that emergency request.');
  res.json({ event });
}));

module.exports = router;
