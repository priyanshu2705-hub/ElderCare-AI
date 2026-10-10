const router = require('express').Router();
const { z } = require('zod');
const TrustedContact = require('../models/TrustedContact');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');
const { buildCaregiverView } = require('../services/privacyFilter');

router.use(authenticate, requireRole('caregiver'));

const dashQuery = z.object({ elderId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid person.').optional() });

// Elders who listed this caregiver as a trusted contact. This is the ONLY source of access.
async function linkedElderIds(caregiverId) {
  const links = await TrustedContact.find({ caregiverUserId: caregiverId }).select('elderUserId');
  return [...new Set(links.map((l) => l.elderUserId.toString()))];
}

router.get('/elders', asyncHandler(async (req, res) => {
  const ids = await linkedElderIds(req.user._id);
  const elders = await User.find({ _id: { $in: ids } }).select('name');
  res.json({ elders: elders.map((e) => ({ id: e._id, name: e.name })) });
}));

router.get('/dashboard', validate(dashQuery, 'query'), asyncHandler(async (req, res) => {
  const ids = await linkedElderIds(req.user._id);
  if (!ids.length) throw new AppError(404, 'No one has added you as a family contact yet.');
  const elderId = req.query.elderId || ids[0];
  if (!ids.includes(elderId)) throw new AppError(403, "You don't have permission to see this person's information.");
  res.json(await buildCaregiverView(elderId));
}));

module.exports = router;
