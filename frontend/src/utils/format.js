// Date/time helpers. Dates are 'YYYY-MM-DD', times 'HH:mm' (same format as the backend).
const pad = (n) => String(n).padStart(2, '0');

export const localYMD = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const nowHHMM = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function addDaysYMD(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number);
  return localYMD(new Date(y, m - 1, d + n));
}

export function friendlyDate(ymd, now = new Date()) {
  const today = localYMD(now);
  if (ymd === today) return 'Today';
  if (ymd === addDaysYMD(today, 1)) return 'Tomorrow';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function friendlyTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
}

// Minutes since a time today (negative = still in the future)
export function minutesSince(hhmm, now = new Date()) {
  const [h, m] = hhmm.split(':').map(Number);
  return now.getHours() * 60 + now.getMinutes() - (h * 60 + m);
}

export function timeAgo(iso, now = Date.now()) {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}
