import assert from 'node:assert/strict';
import { localYMD, addDaysYMD, friendlyDate, friendlyTime, greeting, minutesSince, timeAgo } from '../src/utils/format.js';

const now = new Date(2026, 9, 8, 15, 30); // Thu 8 Oct 2026, 3:30 PM (local)
assert.equal(localYMD(now), '2026-10-08');
assert.equal(addDaysYMD('2026-10-31', 1), '2026-11-01');
assert.equal(addDaysYMD('2026-12-31', 1), '2027-01-01');
assert.equal(friendlyDate('2026-10-08', now), 'Today');
assert.equal(friendlyDate('2026-10-09', now), 'Tomorrow');
assert.match(friendlyDate('2026-10-15', now), /Thursday/);
assert.equal(friendlyTime('19:00'), '7:00 PM');
assert.equal(friendlyTime('00:05'), '12:05 AM');
assert.equal(friendlyTime('12:00'), '12:00 PM');
assert.equal(greeting(new Date(2026, 9, 8, 8)), 'Good Morning');
assert.equal(greeting(new Date(2026, 9, 8, 14)), 'Good Afternoon');
assert.equal(greeting(new Date(2026, 9, 8, 20)), 'Good Evening');
assert.equal(minutesSince('15:00', now), 30);
assert.equal(minutesSince('16:00', now), -30);
assert.equal(timeAgo('2026-10-08T09:20:00Z', Date.parse('2026-10-08T09:30:00Z')), '10 minutes ago');
assert.equal(timeAgo('2026-10-08T09:29:40Z', Date.parse('2026-10-08T09:30:00Z')), 'just now');
console.log('format utils: ALL PASSED');
