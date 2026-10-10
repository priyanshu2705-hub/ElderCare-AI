const { z } = require('zod');

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please give a date like 2026-10-15.')
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), 'That date does not exist.');
const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Please give a time like 19:00.');
const phone = z.string().trim().regex(/^[+\d][\d\s-]{6,19}$/, 'Please enter a valid phone number.');
const CATEGORIES = ['general', 'bill', 'call', 'appointment', 'medicine', 'grocery', 'household'];

module.exports = { dateStr, timeStr, phone, CATEGORIES };
