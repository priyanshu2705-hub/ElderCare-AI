const router = require('express').Router();
const { z } = require('zod');
const GroceryItem = require('../models/GroceryItem');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('elder'));

const createSchema = z.object({ name: z.string().trim().min(1, 'Please tell me what to add.').max(80), quantity: z.string().trim().max(40).optional() });
const updateSchema = z.object({ bought: z.boolean() }).strict();

router.get('/', asyncHandler(async (req, res) => {
  res.json({ items: await GroceryItem.find({ userId: req.user._id }).sort({ bought: 1, createdAt: -1 }).limit(200) });
}));
router.post('/', validate(createSchema), asyncHandler(async (req, res) => {
  res.status(201).json({ item: await GroceryItem.create({ userId: req.user._id, ...req.body }) });
}));
router.put('/:id', validate(updateSchema), asyncHandler(async (req, res) => {
  const item = await GroceryItem.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, req.body, { new: true });
  if (!item) throw new AppError(404, 'I could not find that item.');
  res.json({ item });
}));
router.delete('/:id', asyncHandler(async (req, res) => {
  const item = await GroceryItem.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!item) throw new AppError(404, 'I could not find that item.');
  res.json({ ok: true });
}));

module.exports = router;
