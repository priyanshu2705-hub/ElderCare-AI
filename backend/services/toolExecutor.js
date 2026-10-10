// The ONLY place that changes data on behalf of the AI.
// AI -> (validated tool call) -> this file -> MongoDB
const { z } = require('zod');
const env = require('../config/env');
const Reminder = require('../models/Reminder');
const Appointment = require('../models/Appointment');
const GroceryItem = require('../models/GroceryItem');
const TrustedContact = require('../models/TrustedContact');
const EmergencyEvent = require('../models/EmergencyEvent');
const PrivacySettings = require('../models/PrivacySettings');
const ActivityLog = require('../models/ActivityLog');
const { dateStr, timeStr, CATEGORIES } = require('../utils/schemas');
const { todayInTz, nowTimeInTz, friendlyDate, friendlyTime } = require('../utils/dates');

const tz = env.timezone;
const log = (elderUserId, type, summary) => ActivityLog.create({ elderUserId, type, summary }).catch(() => {});
const ok = (message, data) => ({ ok: true, message, data });
const fail = (message) => ({ ok: false, message });

async function createEmergencyEvent(userId, triggerType = 'button') {
  const event = await EmergencyEvent.create({ elderUserId: userId, triggerType });
  await log(userId, 'emergency', 'Asked for emergency help');
  return event;
}

const tools = {
  createReminder: {
    schema: z.object({
      title: z.string().trim().min(1).max(120),
      description: z.string().trim().max(500).optional(),
      date: dateStr,
      time: timeStr.default('09:00'),
      category: z.enum(CATEGORIES).default('general'),
    }),
    async run(a, { userId }) {
      const today = todayInTz(tz);
      if (a.date < today) return fail('That day has already passed. Which day would you like?');
      if (a.date === today && a.time <= nowTimeInTz(tz)) return fail('That time has already passed today. What time would you like?');
      const reminder = await Reminder.create({ userId, ...a });
      await log(userId, 'reminder_created', `Reminder added: ${a.title}`);
      return ok(`Okay. I'll remind you ${friendlyDate(a.date, tz)} at ${friendlyTime(a.time)}: ${a.title}.`, reminder);
    },
  },

  listReminders: {
    schema: z.object({ scope: z.enum(['today', 'upcoming']).default('today') }),
    async run({ scope }, { userId }) {
      const today = todayInTz(tz);
      const query = { userId, status: 'pending' };
      query.date = scope === 'today' ? today : { $gte: today };
      const items = await Reminder.find(query).sort({ date: 1, time: 1 }).limit(10);
      const label = scope === 'today' ? 'today' : 'coming up';
      if (!items.length) return ok(`You have no reminders ${label}.`, []);
      const lines = items.map((r) => `${r.title} ${scope === 'today' ? '' : friendlyDate(r.date, tz) + ' '}at ${friendlyTime(r.time)}`.replace(/\s+/g, ' '));
      return ok(`You have ${items.length} reminder${items.length > 1 ? 's' : ''} ${label}: ${lines.join('. ')}.`, items);
    },
  },

  completeReminder: {
    schema: z.object({ titleMatch: z.string().trim().min(1).max(120) }),
    async run({ titleMatch }, { userId }) {
      const pending = await Reminder.find({ userId, status: 'pending' }).sort({ date: 1, time: 1 }).limit(100);
      const needle = titleMatch.toLowerCase();
      const found = pending.find((r) => r.title.toLowerCase().includes(needle));
      if (!found) return fail("I couldn't find that reminder. Which one did you mean?");
      found.status = 'done';
      found.completedAt = new Date();
      await found.save();
      await log(userId, 'reminder_done', `Completed: ${found.title}`);
      return ok(`Done. I marked "${found.title}" as finished.`, found);
    },
  },

  addGroceryItem: {
    schema: z.object({ name: z.string().trim().min(1).max(80), quantity: z.string().trim().max(40).optional() }),
    async run(a, { userId }) {
      const item = await GroceryItem.create({ userId, ...a });
      await log(userId, 'grocery_added', `Grocery added: ${a.name}`);
      return ok(`Okay. I added ${a.name} to your grocery list.`, item);
    },
  },

  createAppointment: {
    schema: z.object({
      title: z.string().trim().min(1).max(120),
      date: dateStr,
      time: timeStr.default('10:00'),
      location: z.string().trim().max(200).optional(),
    }),
    async run(a, { userId }) {
      if (a.date < todayInTz(tz)) return fail('That day has already passed. Which day would you like?');
      const appt = await Appointment.create({ userId, ...a });
      await log(userId, 'appointment_created', `Appointment added: ${a.title}`);
      return ok(`Okay. I saved "${a.title}" for ${friendlyDate(a.date, tz)} at ${friendlyTime(a.time)}.`, appt);
    },
  },

  getUpcomingAppointments: {
    schema: z.object({}).passthrough(),
    async run(_a, { userId }) {
      const items = await Appointment.find({ userId, date: { $gte: todayInTz(tz) } }).sort({ date: 1, time: 1 }).limit(5);
      if (!items.length) return ok('You have no appointments coming up.', []);
      const lines = items.map((x) => `${x.title}, ${friendlyDate(x.date, tz)} at ${friendlyTime(x.time)}`);
      return ok(`Your next appointments: ${lines.join('. ')}.`, items);
    },
  },

  getTrustedContacts: {
    schema: z.object({}).passthrough(),
    async run(_a, { userId }) {
      const items = await TrustedContact.find({ elderUserId: userId });
      if (!items.length) return ok("You haven't added a trusted contact yet. You can add one in Family settings.", []);
      return ok(`Your trusted contacts: ${items.map((c) => `${c.name}${c.relationship ? ` (${c.relationship})` : ''}`).join(', ')}.`, items);
    },
  },

  getPrivacySettings: {
    schema: z.object({}).passthrough(),
    async run(_a, { userId }) {
      const s = (await PrivacySettings.findOne({ elderUserId: userId })) || {};
      const shared = [];
      if (s.shareEmergencyEvents) shared.push('emergency alerts');
      if (s.shareReminders) shared.push('reminders');
      if (s.shareAppointments) shared.push('appointments');
      if (s.shareGrocery) shared.push('grocery list');
      if (s.shareActivity) shared.push('when you were last active');
      const msg = shared.length ? `Your family can see: ${shared.join(', ')}.` : 'Your family cannot see anything right now.';
      return ok(`${msg} They never see your photos, documents or questions.`, s);
    },
  },

  // Called by the emergency route after the elder confirms. Not callable from AI chat.
  triggerEmergencyMode: {
    schema: z.object({ triggerType: z.enum(['button', 'voice', 'text']).default('button') }),
    async run({ triggerType }, { userId }) {
      const event = await createEmergencyEvent(userId, triggerType);
      return ok('Emergency mode started.', event);
    },
  },
};

// What the AI is allowed to ask for
const AI_ALLOWED = [
  'createReminder', 'listReminders', 'completeReminder', 'addGroceryItem',
  'createAppointment', 'getUpcomingAppointments', 'getTrustedContacts', 'getPrivacySettings',
];

async function executeTool(name, args, ctx) {
  const tool = tools[name];
  if (!tool) return fail("I can't do that yet.");
  const parsed = tool.schema.safeParse(args || {});
  if (!parsed.success) return fail("I wasn't sure about the details. Could you say that again, with the day and time?");
  return tool.run(parsed.data, ctx);
}

module.exports = { executeTool, AI_ALLOWED, createEmergencyEvent };
