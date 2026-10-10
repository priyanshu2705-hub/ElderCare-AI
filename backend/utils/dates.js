// All dates are plain 'YYYY-MM-DD' / 'HH:mm' strings in the elder's timezone.
const todayInTz = (tz) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

const nowTimeInTz = (tz) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());

const addDays = (ymd, n) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

const weekday = (ymd) => new Date(`${ymd}T00:00:00Z`).getUTCDay(); // 0=Sun

// Next occurrence of a weekday strictly after `ymd` (5 = Friday)
const nextWeekday = (ymd, target) => {
  let diff = (target - weekday(ymd) + 7) % 7;
  if (diff === 0) diff = 7;
  return addDays(ymd, diff);
};

const friendlyDate = (ymd, tz) => {
  const today = todayInTz(tz);
  if (ymd === today) return 'today';
  if (ymd === addDays(today, 1)) return 'tomorrow';
  return new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${ymd}T00:00:00Z`)
  );
};

const friendlyTime = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

module.exports = { todayInTz, nowTimeInTz, addDays, nextWeekday, friendlyDate, friendlyTime };
