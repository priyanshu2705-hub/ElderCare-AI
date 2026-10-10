const router = require('express').Router();
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const aiClient = require('../services/aiClient');
const { upload, hasImageSignature } = require('../middleware/upload');
const { authenticate, requireRole } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');

router.use(authenticate, requireRole('elder'), aiLimiter);

// Photos are held in memory only, sent to the AI service, and discarded. Nothing is stored.
router.post('/analyze', upload.single('image'), asyncHandler(async (req, res) => {
  // "Try a sample bill" button for demos (no upload needed)
  if (req.query.sample === 'true') return res.json({ analysis: await aiClient.analyzeSample() });

  if (!req.file || !req.file.size) throw new AppError(400, 'I did not receive a photo. Please take or choose a photo.');
  if (!hasImageSignature(req.file.buffer)) throw new AppError(400, 'That file does not look like a photo. Please try another one.');

  const analysis = await aiClient.analyzeDocument(req.file, { today: new Date().toISOString().slice(0, 10) });
  res.json({ analysis });
}));

module.exports = router;
