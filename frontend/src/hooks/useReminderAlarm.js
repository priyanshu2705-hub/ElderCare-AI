import { useEffect, useRef } from 'react';
import { api } from '../services/api.js';
import { minutesSince, nowHHMM } from '../utils/format.js';

const KEY = 'eldercare_alerted';
const WINDOW_MIN = 30; // only alert for reminders that came due in the last 30 minutes

/** While the app is open, checks every 30 seconds for a reminder that is due and calls onDue(reminder).
 *  Limit: browsers cannot run this when the app is closed (that needs push notifications). */
export default function useReminderAlarm({ enabled, onDue }) {
  const alerted = useRef(new Set(JSON.parse(sessionStorage.getItem(KEY) || '[]')));

  useEffect(() => {
    if (!enabled) return undefined;
    let stopped = false;
    async function check() {
      try {
        const { reminders } = await api.get('/reminders?scope=today');
        const now = nowHHMM();
        const due = reminders.find((r) => {
          const late = minutesSince(r.time);
          return r.status === 'pending' && r.time <= now && late <= WINDOW_MIN && !alerted.current.has(r._id);
        });
        if (due && !stopped) {
          alerted.current.add(due._id);
          sessionStorage.setItem(KEY, JSON.stringify([...alerted.current]));
          onDue(due);
        }
      } catch { /* offline: try again in 30 seconds */ }
    }
    check();
    const id = setInterval(check, 30000);
    return () => { stopped = true; clearInterval(id); };
  }, [enabled, onDue]);
}
