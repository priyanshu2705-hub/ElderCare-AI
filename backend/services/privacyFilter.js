// Server-side privacy enforcement for the caregiver dashboard.
// Anything the elder has not shared is never loaded, never returned.
const env = require('../config/env');
const User = require('../models/User');
const Reminder = require('../models/Reminder');
const Appointment = require('../models/Appointment');
const GroceryItem = require('../models/GroceryItem');
const EmergencyEvent = require('../models/EmergencyEvent');
const ActivityLog = require('../models/ActivityLog');
const PrivacySettings = require('../models/PrivacySettings');
const { todayInTz } = require('../utils/dates');

const DEFAULTS = {
  shareReminders: true, shareAppointments: true, shareGrocery: true, shareEmergencyEvents: true,
  shareDocuments: false, shareActivity: true, allowLocationInEmergency: true,
};

// Human-friendly table for the Privacy tab (also shows what is NEVER collected)
function privacyRows(s) {
  const yn = (v) => (v ? 'shared' : 'notShared');
  return [
    { key: 'emergency', label: 'Emergency alerts', status: yn(s.shareEmergencyEvents) },
    { key: 'reminders', label: 'Reminders', status: yn(s.shareReminders) },
    { key: 'appointments', label: 'Appointments', status: yn(s.shareAppointments) },
    { key: 'grocery', label: 'Grocery list', status: yn(s.shareGrocery) },
    { key: 'activity', label: 'Last active and task activity', status: yn(s.shareActivity) },
    { key: 'location', label: 'Location', status: s.allowLocationInEmergency ? 'emergencyOnly' : 'notShared' },
    { key: 'documents', label: 'Documents and photos', status: 'neverStored' },
    { key: 'conversations', label: 'Conversations and AI questions', status: 'neverStored' },
  ];
}

async function buildCaregiverView(elderId) {
  const tz = env.timezone;
  const [elder, stored] = await Promise.all([
    User.findById(elderId).select('name lastActiveAt'),
    PrivacySettings.findOne({ elderUserId: elderId }),
  ]);
  const s = stored ? stored.toObject() : DEFAULTS;
  const today = todayInTz(tz);

  const view = {
    elder: { id: elder._id, name: elder.name },
    today,
    summary: null,
    reminders: null,
    appointments: null,
    grocery: null,
    emergencies: null,
    activity: null,
    lastActiveAt: null,
    privacy: privacyRows(s),
  };

  const jobs = [];

  if (s.shareReminders) {
    jobs.push(
      Reminder.find({ userId: elderId, date: { $gte: today } })
        .sort({ date: 1, time: 1 }).limit(50)
        .select('title date time category status')
        .then((rows) => {
          view.reminders = rows;
          const todays = rows.filter((r) => r.date === today);
          const completed = todays.filter((r) => r.status === 'done').length;
          view.summary = { todayTotal: todays.length, completed, pending: todays.length - completed };
        })
    );
  }
  if (s.shareAppointments) {
    jobs.push(
      Appointment.find({ userId: elderId, date: { $gte: today } })
        .sort({ date: 1, time: 1 }).limit(10).select('title date time location')
        .then((rows) => { view.appointments = rows; })
    );
  }
  if (s.shareGrocery) {
    jobs.push(
      GroceryItem.find({ userId: elderId, bought: false }).sort({ createdAt: -1 }).limit(30).select('name quantity')
        .then((rows) => { view.grocery = rows; })
    );
  }
  if (s.shareEmergencyEvents) {
    jobs.push(
      EmergencyEvent.find({ elderUserId: elderId }).sort({ timestamp: -1 }).limit(10)
        .then((rows) => {
          view.emergencies = rows.map((e) => ({
            id: e._id,
            timestamp: e.timestamp,
            triggerType: e.triggerType,
            status: e.status,
            // location only if the elder chose to share it AND allows family to see it
            locationShared: e.locationShared && s.allowLocationInEmergency,
            location: e.locationShared && s.allowLocationInEmergency ? e.location : undefined,
          }));
        })
    );
  }
  if (s.shareActivity) {
    view.lastActiveAt = elder.lastActiveAt || null;
    jobs.push(
      ActivityLog.find({ elderUserId: elderId, type: { $ne: 'emergency' } }).sort({ createdAt: -1 }).limit(10)
        .select('summary createdAt')
        .then((rows) => { view.activity = rows; })
    );
  }

  await Promise.all(jobs);
  return view;
}

module.exports = { buildCaregiverView };
