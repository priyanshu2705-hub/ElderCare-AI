import { useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { friendlyTime } from '../utils/format.js';

// Big pop-up shown when a reminder comes due. Focus moves to the main button.
export default function ReminderAlert({ reminder, onDone, onClose }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center" role="alertdialog" aria-modal="true" aria-labelledby="alert-title">
      <div className="w-full max-w-lg rounded-3xl bg-surface p-6 shadow-xl">
        <p className="flex items-center gap-2 text-xl font-bold text-primary"><Bell aria-hidden /> Reminder</p>
        <h2 id="alert-title" className="mt-2 text-4xl font-bold leading-tight">{reminder.title}</h2>
        <p className="mt-2 text-2xl text-muted">It is {friendlyTime(reminder.time)}.</p>
        <div className="mt-6 space-y-3">
          <button ref={ref} type="button" onClick={onDone} className="btn-success"><Check aria-hidden /> Done</button>
          <button type="button" onClick={onClose} className="btn-secondary">Remind me later</button>
        </div>
      </div>
    </div>
  );
}
