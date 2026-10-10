import assert from 'node:assert/strict';
import { latestActiveAlert, mapsUrl, activityChip, emergencyStatus } from '../src/utils/dashboard.js';

const now = Date.parse('2026-10-08T10:00:00Z');
const hrs = (h) => new Date(now - h * 3600e3).toISOString();

assert.equal(latestActiveAlert(null, now), null, 'not shared -> null');
assert.equal(latestActiveAlert([], now), null);
assert.equal(latestActiveAlert([{ id: 1, status: 'resolved', timestamp: hrs(1) }], now), null, 'resolved is not active');
assert.equal(latestActiveAlert([{ id: 2, status: 'active', timestamp: hrs(30) }], now), null, 'older than 24h is not shown as active');
assert.equal(latestActiveAlert([{ id: 3, status: 'cancelled', timestamp: hrs(1) }, { id: 4, status: 'active', timestamp: hrs(2) }], now).id, 4);

assert.equal(mapsUrl({ lat: 24.8170, lng: 93.9368 }), 'https://www.google.com/maps?q=24.817,93.9368');
assert.equal(mapsUrl(undefined), null);
assert.equal(mapsUrl({ lat: '1', lng: '2' }), null, 'rejects non-numbers');

assert.deepEqual(activityChip('x', false, now), { tone: 'muted', text: 'Activity not shared' });
assert.deepEqual(activityChip(null, true, now), { tone: 'muted', text: 'No recent activity' });
assert.deepEqual(activityChip(new Date(now - 10 * 60e3).toISOString(), true, now), { tone: 'ok', text: 'Last active 10 min ago' });
assert.deepEqual(activityChip(new Date(now - 3 * 3600e3).toISOString(), true, now), { tone: 'warn', text: 'Last active 3 hr ago' });
assert.deepEqual(activityChip(new Date(now - 26 * 3600e3).toISOString(), true, now), { tone: 'warn', text: 'Last active 1 day ago' });

assert.deepEqual(emergencyStatus(null, now), { tone: 'muted', text: 'Not shared' });
assert.deepEqual(emergencyStatus([], now), { tone: 'ok', text: 'No active alerts' });
assert.deepEqual(emergencyStatus([{ status: 'active', timestamp: hrs(1) }], now), { tone: 'danger', text: 'Active alert' });
console.log('dashboard helpers: ALL PASSED');
