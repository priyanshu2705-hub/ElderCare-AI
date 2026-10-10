// Pure helpers for the family dashboard (kept separate so they can be unit-tested).
export const TRIGGER_TEXT = { button: 'Pressed the help button', voice: 'Said they needed help', text: 'Typed that they needed help' };
export const STATUS_TEXT = { active: 'Active', resolved: 'Resolved', cancelled: 'Cancelled (false alarm)' };

// The newest emergency that is still "active" and happened in the last `hours` hours
export function latestActiveAlert(emergencies, now = Date.now(), hours = 24) {
  if (!emergencies) return null;
  return emergencies.find((e) => e.status === 'active' && now - new Date(e.timestamp).getTime() < hours * 3600 * 1000) || null;
}

export function mapsUrl(loc) {
  if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return null;
  return `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
}

// "Last active" chip. tone: ok | warn | muted
export function activityChip(lastActiveAt, shared, now = Date.now()) {
  if (!shared) return { tone: 'muted', text: 'Activity not shared' };
  if (!lastActiveAt) return { tone: 'muted', text: 'No recent activity' };
  const mins = Math.max(0, Math.round((now - new Date(lastActiveAt).getTime()) / 60000));
  const ago = mins < 1 ? 'just now' : mins < 60 ? `${mins} min ago` : mins < 1440 ? `${Math.round(mins / 60)} hr ago` : `${Math.round(mins / 1440)} day${Math.round(mins / 1440) === 1 ? '' : 's'} ago`;
  return { tone: mins <= 30 ? 'ok' : 'warn', text: `Last active ${ago}` };
}

// Status of the "Emergency" stat card
export function emergencyStatus(emergencies, now = Date.now()) {
  if (emergencies === null) return { tone: 'muted', text: 'Not shared' };
  return latestActiveAlert(emergencies, now) ? { tone: 'danger', text: 'Active alert' } : { tone: 'ok', text: 'No active alerts' };
}

export const privacyLabel = { shared: ['✓', 'Shared', 'ok'], notShared: ['✗', 'Not shared', 'muted'], emergencyOnly: ['⚠', 'Only during an emergency', 'warn'], neverStored: ['🔒', 'Never stored', 'muted'] };
