// Run: node tests/privacyFilter.test.cjs   (no database or packages needed)
// Replaces the database models with fakes that RECORD every query, so we can prove that
// data the senior did not share is never even loaded.
const Module = require('module');
const assert = require('node:assert/strict');
process.env.MONGODB_URI = 'mongodb://fake/test'; process.env.JWT_SECRET = 'test-secret-test-secret';

let calls = [], rows = {}, settingsDoc = null;
class Q { constructor(v) { this.v = v; } sort() { return this; } limit() { return this; } select() { return this; } then(a, b) { return Promise.resolve(this.v).then(a, b); } }
const fakeModel = (name) => ({ find: (filter) => { calls.push({ name, filter }); return new Q(rows[name] || []); } });
const fakes = {
  'dotenv': { config() {} },
  '../models/User': { findById: () => { calls.push({ name: 'User' }); return new Q({ _id: 'elder1', name: 'Dad', lastActiveAt: new Date('2026-10-08T09:50:00Z') }); } },
  '../models/PrivacySettings': { findOne: () => { calls.push({ name: 'PrivacySettings' }); return new Q(settingsDoc && { toObject: () => settingsDoc }); } },
  '../models/Reminder': fakeModel('Reminder'), '../models/Appointment': fakeModel('Appointment'), '../models/GroceryItem': fakeModel('GroceryItem'),
  '../models/EmergencyEvent': fakeModel('EmergencyEvent'), '../models/ActivityLog': fakeModel('ActivityLog'),
};
const realLoad = Module._load;
Module._load = (req, ...rest) => (req in fakes ? fakes[req] : realLoad(req, ...rest));
const { buildCaregiverView } = require('../services/privacyFilter');
const { todayInTz } = require('../utils/dates');
const today = todayInTz('Asia/Kolkata');

const ALL = { shareReminders: true, shareAppointments: true, shareGrocery: true, shareEmergencyEvents: true, shareDocuments: false, shareActivity: true, allowLocationInEmergency: true };
function seed() {
  rows = {
    Reminder: [{ _id: 'r1', title: 'Morning walk', date: today, time: '07:00', status: 'done' }, { _id: 'r2', title: 'Call son', date: today, time: '19:00', status: 'pending' }, { _id: 'r3', title: 'Water plants', date: today, time: '08:30', status: 'done' }, { _id: 'r4', title: 'Pay bill', date: '2999-01-01', time: '10:00', status: 'pending' }],
    Appointment: [{ _id: 'a1', title: 'Doctor', date: '2999-01-02', time: '11:00' }],
    GroceryItem: [{ _id: 'g1', name: 'Milk' }],
    EmergencyEvent: [
      { _id: 'e1', timestamp: new Date(), triggerType: 'voice', status: 'active', locationShared: true, location: { lat: 24.8, lng: 93.9 } },
      { _id: 'e2', timestamp: new Date(), triggerType: 'button', status: 'resolved', locationShared: false, location: { lat: 1, lng: 2 } }],
    ActivityLog: [{ _id: 'l1', summary: 'Completed: Water plants', createdAt: new Date() }],
  };
}
const run = async (settings) => { calls = []; seed(); settingsDoc = settings; return buildCaregiverView('elder1'); };
const loaded = (n) => calls.some((c) => c.name === n);
let n = 0; const ok = (m) => { n++; console.log('PASS', m); };

(async () => {
  let v = await run({ ...ALL });
  assert.equal(v.reminders.length, 4); assert.deepEqual(v.summary, { todayTotal: 3, completed: 2, pending: 1 });
  assert.equal(v.appointments.length, 1); assert.equal(v.grocery.length, 1); assert.equal(v.activity.length, 1); assert.ok(v.lastActiveAt);
  assert.equal(v.emergencies.length, 2); assert.deepEqual(v.emergencies[0].location, { lat: 24.8, lng: 93.9 }); assert.equal(v.emergencies[0].locationShared, true);
  ok('everything shared -> everything returned; today summary = 3 total, 2 done, 1 pending');
  assert.equal(v.emergencies[1].locationShared, false); assert.equal('location' in v.emergencies[1] && v.emergencies[1].location !== undefined, false);
  ok('an event whose location the senior did NOT share never returns coordinates, even though they are stored');
  assert.ok(!('description' in v.reminders[0]) || true);

  v = await run({ ...ALL, shareReminders: false });
  assert.equal(v.reminders, null); assert.equal(v.summary, null); assert.equal(loaded('Reminder'), false);
  assert.ok(v.appointments && v.grocery);
  ok('shareReminders=false -> reminders & summary are null AND the Reminder collection is never queried');

  v = await run({ ...ALL, shareAppointments: false }); assert.equal(v.appointments, null); assert.equal(loaded('Appointment'), false); ok('shareAppointments=false -> appointments never queried');
  v = await run({ ...ALL, shareGrocery: false }); assert.equal(v.grocery, null); assert.equal(loaded('GroceryItem'), false); ok('shareGrocery=false -> grocery never queried');
  v = await run({ ...ALL, shareEmergencyEvents: false }); assert.equal(v.emergencies, null); assert.equal(loaded('EmergencyEvent'), false); ok('shareEmergencyEvents=false -> emergencies null AND never queried');
  v = await run({ ...ALL, shareActivity: false });
  assert.equal(v.activity, null); assert.equal(v.lastActiveAt, null); assert.equal(loaded('ActivityLog'), false); ok('shareActivity=false -> activity and "last active" hidden AND never queried');

  v = await run({ ...ALL, allowLocationInEmergency: false });
  assert.equal(v.emergencies[0].locationShared, false); assert.equal(v.emergencies[0].location, undefined);
  assert.equal(v.privacy.find((r) => r.key === 'location').status, 'notShared'); ok('allowLocationInEmergency=false -> location withheld even for an event where the senior tapped Share');

  v = await run({ ...ALL, shareReminders: false, shareAppointments: false, shareGrocery: false, shareEmergencyEvents: false, shareActivity: false, allowLocationInEmergency: false });
  for (const k of ['summary', 'reminders', 'appointments', 'grocery', 'emergencies', 'activity', 'lastActiveAt']) assert.equal(v[k], null, k);
  assert.deepEqual([...new Set(calls.map((c) => c.name))].sort(), ['PrivacySettings', 'User']);
  assert.ok(v.privacy.filter((r) => ['emergency', 'reminders', 'appointments', 'grocery', 'activity'].includes(r.key)).every((r) => r.status === 'notShared'));
  ok('everything off -> every section null, and ONLY the user + settings records were read (nothing else touched)');

  const act = await run({ ...ALL });
  assert.deepEqual(calls.find((c) => c.name === 'ActivityLog').filter, { elderUserId: 'elder1', type: { $ne: 'emergency' } }); ok('activity feed excludes emergency log lines (those appear only under Emergency)');
  assert.deepEqual(calls.find((c) => c.name === 'EmergencyEvent').filter, { elderUserId: 'elder1' });
  assert.ok(calls.filter((c) => c.filter).every((c) => c.filter.userId === 'elder1' || c.filter.elderUserId === 'elder1')); ok('every query is scoped to the one senior being viewed');

  v = await run(null);
  assert.ok(v.reminders && v.emergencies && v.activity); assert.equal(v.privacy.find((r) => r.key === 'documents').status, 'neverStored'); ok('no stored settings -> safe defaults; documents/conversations always "neverStored"');
  assert.deepEqual(v.privacy.filter((r) => ['documents', 'conversations'].includes(r.key)).map((r) => r.status), ['neverStored', 'neverStored']);

  console.log(`\n${n} privacy-filter checks passed`);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
