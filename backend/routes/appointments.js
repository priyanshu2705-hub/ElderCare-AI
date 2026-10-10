const router = require('express').Router();
const { z } = require('zod');
const env = require('../config/env');
const Appointment = require('../models/Appointment');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { dateStr, timeStr } = require('../utils/schemas');
const { todayInTz } = require('../utils/dates');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('elder'));

const createSchema = z.object({
  title: z.string().trim().min(1, 'Please tell me what the appointment is.').max(120),
  date: dateStr,
  time: timeStr.default('10:00'),
  location: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(500).optional(),
});

router.get('/', asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ userId: req.user._id, date: { $gte: todayInTz(env.timezone) } }).sort({ date: 1, time: 1 }).limit(50);
  res.json({ appointments });
}));

router.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  if (req.body.date < todayInTz(env.timezone)) throw new AppError(400, 'That day has already passed.');
  res.status(201).json({ appointment: await Appointment.create({ userId: req.user._id, ...req.body }) });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const a = await Appointment.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!a) throw new AppError(404, 'I could not find that appointment.');
  res.json({ ok: true });
}));

module.exports = router;
