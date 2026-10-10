const router = require('express').Router();
const { z } = require('zod');
const env = require('../config/env');
const Reminder = require('../models/Reminder');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middleware/validate');
const aiClient = require('../services/aiClient');
const { executeTool, AI_ALLOWED } = require('../services/toolExecutor');
const { todayInTz, nowTimeInTz } = require('../utils/dates');
const { authenticate, requireRole } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');

router.use(authenticate, requireRole('elder'), aiLimiter);

const chatSchema = z.object({
  text: z.string().trim().min(1, 'Please say or type something.').max(500),
  // What is on screen right now (e.g. "Pay electricity bill"), so "remind me tomorrow" knows what about.
  topic: z.string().trim().max(120).optional(),
});
const explainSchema = z.object({ text: z.string().trim().min(1, 'Please paste the text you want explained.').max(4000) });

// Emergency detection must work even if the AI service is down, so it also lives here.
const EMERGENCY_RE = /\b(emergency|i need help(?!\s+(with|to|in|understanding|reading|finding|figuring))|need help now|i have fallen|i('| ha)ve fallen|i fell|can'?t breathe|cannot breathe|chest pain|heart attack|call (an )?ambulance|someone help)\b/i;
const EMERGENCY_REPLY = 'I am here to help. I will open the emergency screen now.';
const MEDICAL_EMERGENCY_REPLY = 'Chest pain and trouble breathing can be serious. I am opening the emergency screen. Please call 112 or your family right now.';
const SERIOUS_RE = /chest pain|breathe|heart attack/i;

// Last line of defence: the assistant must never claim it did something it did not do.
const ACTION_CLAIM_RE = /\b(i('| ha)ve|i)\s+(just\s+)?(called|sent|texted|paid|booked|alerted|notified|messaged)\b/i;
const SAFE_NO_ACTION = "I can't do that myself, but I can show you how. What would you like to do?";

router.post('/chat', validate(chatSchema), asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (EMERGENCY_RE.test(text)) {
    return res.json({ intent: 'EMERGENCY', reply: SERIOUS_RE.test(text) ? MEDICAL_EMERGENCY_REPLY : EMERGENCY_REPLY, action: { type: 'OPEN_EMERGENCY', triggerType: 'voice' } });
  }

  const todays = await Reminder.find({ userId: req.user._id, date: todayInTz(env.timezone) }).sort({ time: 1 }).limit(20);
  let ai;
  try {
    ai = await aiClient.chat({
      text,
      context: {
        elderName: req.user.name,
        today: todayInTz(env.timezone),
        nowTime: nowTimeInTz(env.timezone),
        timezone: env.timezone,
        todaysReminders: todays.map((r) => ({ title: r.title, time: r.time, status: r.status })),
        recentTopic: req.body.topic,
      },
    });
  } catch (e) {
    return res.status(200).json({ intent: 'UNKNOWN', reply: e.message, error: true });
  }

  // The AI service's own EMERGENCY classification also opens the emergency screen.
  if (ai.intent === 'EMERGENCY') {
    return res.json({ intent: 'EMERGENCY', reply: EMERGENCY_REPLY, action: { type: 'OPEN_EMERGENCY', triggerType: 'voice' }, demoMode: ai.demoMode });
  }

  let reply = ai.reply;
  let toolResult = null;
  if (ai.toolCall && AI_ALLOWED.includes(ai.toolCall.name)) {
    toolResult = await executeTool(ai.toolCall.name, ai.toolCall.args, { userId: req.user._id });
    reply = toolResult.message; // spoken text comes from what REALLY happened
  } else if (ACTION_CLAIM_RE.test(reply || '')) {
    reply = SAFE_NO_ACTION;
  }

  const action = ai.action === 'OPEN_CAMERA' ? { type: 'OPEN_CAMERA' } : undefined;

  res.json({
    intent: ai.intent,
    action,
    reply: reply || "I'm sorry, I did not understand. Could you say that another way?",
    tool: toolResult ? { name: ai.toolCall.name, ok: toolResult.ok, data: toolResult.data } : null,
    demoMode: !!ai.demoMode,
  });
}));

router.post('/explain', validate(explainSchema), asyncHandler(async (req, res) => {
  const result = await aiClient.explain({ text: req.body.text });
  res.json(result);
}));

module.exports = router;
