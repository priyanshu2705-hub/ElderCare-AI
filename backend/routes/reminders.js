const router = require('express').Router();
const { z } = require('zod');
const env = require('../config/env');
const Reminder = require('../models/Reminder');
const ActivityLog = require('../models/ActivityLog');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { dateStr, timeStr, CATEGORIES } = require('../utils/schemas');
const { todayInTz } = require('../utils/dates');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('elder'));

const createSchema = z.object({
  title: z.string().trim().min(1, 'Please tell me what to remind you about.').max(120),
  description: z.string().trim().max(500).optional(),
  date: dateStr,
  time: timeStr.default('09:00'),
  category: z.enum(CATEGORIES).default('general'),
});
const updateSchema = createSchema.partial().extend({ status: z.enum(['pending', 'done']).optional() }).strict();
const listSchema = z.object({ scope: z.enum(['today', 'upcoming', 'all']).default('today') });

router.get('/', validate(listSchema, 'query'), asyncHandler(async (req, res) => {
  const today = todayInTz(env.timezone);
  const q = { userId: req.user._id };
  if (req.query.scope === 'today') q.date = today;
  if (req.query.scope === 'upcoming') q.date = { $gte: today };
  const reminders = await Reminder.find(q).sort({ date: 1, time: 1 }).limit(200);
  res.json({ reminders, today });
}));

router.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  if (req.body.date < todayInTz(env.timezone)) throw new AppError(400, 'That day has already passed. Please pick today or a later day.');
  const reminder = await Reminder.create({ userId: req.user._id, ...req.body });
  await ActivityLog.create({ elderUserId: req.user._id, type: 'reminder_created', summary: `Reminder added: ${reminder.title}` });
  res.status(201).json({ reminder });
}));

router.put('/:id', validate(updateSchema), asyncHandler(async (req, res) => {
  const update = { ...req.body };
  if (update.status === 'done') update.completedAt = new Date();
  if (update.status === 'pending') update.completedAt = undefined;
  const reminder = await Reminder.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, update, { new: true });
  if (!reminder) throw new AppError(404, 'I could not find that reminder.');
  if (update.status === 'done') {
    await ActivityLog.create({ elderUserId: req.user._id, type: 'reminder_done', summary: `Completed: ${reminder.title}` });
  }
  res.json({ reminder });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const r = await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!r) throw new AppError(404, 'I could not find that reminder.');
  res.json({ ok: true });
}));

module.exports = router;
