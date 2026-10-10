// Demo data. Run:  npm run seed
// Removes and recreates ONLY the two demo accounts and their data.
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const ElderProfile = require('../models/ElderProfile');
const Reminder = require('../models/Reminder');
const Appointment = require('../models/Appointment');
const GroceryItem = require('../models/GroceryItem');
const TrustedContact = require('../models/TrustedContact');
const EmergencyEvent = require('../models/EmergencyEvent');
const PrivacySettings = require('../models/PrivacySettings');
const ActivityLog = require('../models/ActivityLog');
const { todayInTz, addDays, nextWeekday } = require('../utils/dates');

const DEMO_PASSWORD = 'Demo@1234';

(async () => {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });

  const old = await User.find({ email: { $in: ['elder@example.com', 'family@example.com'] } });
  const oldIds = old.map((u) => u._id);
  await Promise.all([
    ElderProfile.deleteMany({ userId: { $in: oldIds } }),
    Reminder.deleteMany({ userId: { $in: oldIds } }),
    Appointment.deleteMany({ userId: { $in: oldIds } }),
    GroceryItem.deleteMany({ userId: { $in: oldIds } }),
    TrustedContact.deleteMany({ elderUserId: { $in: oldIds } }),
    EmergencyEvent.deleteMany({ elderUserId: { $in: oldIds } }),
    PrivacySettings.deleteMany({ elderUserId: { $in: oldIds } }),
    ActivityLog.deleteMany({ elderUserId: { $in: oldIds } }),
    User.deleteMany({ _id: { $in: oldIds } }),
  ]);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const dad = await User.create({ name: 'Dad', email: 'elder@example.com', role: 'elder', passwordHash, lastActiveAt: new Date(Date.now() - 10 * 60 * 1000) });
  const rahul = await User.create({ name: 'Rahul', email: 'family@example.com', role: 'caregiver', passwordHash });

  await ElderProfile.create({ userId: dad._id, age: 72, onboardingDone: true });
  await PrivacySettings.create({ elderUserId: dad._id }); // defaults: documents never shared

  await TrustedContact.create({
    elderUserId: dad._id, name: 'Rahul', relationship: 'Son', phone: '+91 90000 00001',
    email: 'family@example.com', emergencyContact: true, caregiverUserId: rahul._id,
  });

  const today = todayInTz(env.timezone);
  await Reminder.create([
    { userId: dad._id, title: 'Morning walk', date: today, time: '07:00', category: 'general', status: 'done', completedAt: new Date() },
    { userId: dad._id, title: 'Water the plants', date: today, time: '08:30', category: 'household', status: 'done', completedAt: new Date() },
    { userId: dad._id, title: 'Call son', date: today, time: '19:00', category: 'call' },
    { userId: dad._id, title: 'Pay electricity bill', description: 'Bill is about ₹1,240', date: addDays(today, 1), time: '10:00', category: 'bill' },
  ]);
  await Appointment.create({ userId: dad._id, title: 'Doctor appointment', date: nextWeekday(today, 5), time: '11:00', location: 'City Clinic' });
  await GroceryItem.create([{ userId: dad._id, name: 'Milk' }, { userId: dad._id, name: 'Bananas' }, { userId: dad._id, name: 'Rice', quantity: '5 kg' }]);
  await ActivityLog.create([
    { elderUserId: dad._id, type: 'reminder_done', summary: 'Completed: Water the plants' },
    { elderUserId: dad._id, type: 'reminder_done', summary: 'Completed: Morning walk' },
  ]);
  await EmergencyEvent.create({ elderUserId: dad._id, timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000), triggerType: 'button', status: 'resolved' });

  console.log('\nDemo data created.\n  Elder:     elder@example.com  /  ' + DEMO_PASSWORD + '\n  Caregiver: family@example.com /  ' + DEMO_PASSWORD + '\n  (demo credentials only, never use in production)\n');
  await mongoose.disconnect();
})().catch((e) => { console.error('Seed failed:', e.message); process.exit(1); });
