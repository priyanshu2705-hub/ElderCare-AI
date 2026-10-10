import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { api } from '../services/api.js';
import Toggle from './Toggle.jsx';
import { ErrorNote, Spinner } from './ui.jsx';

// Plain language, never legal language. Each switch saves immediately.
const ITEMS = [
  ['shareEmergencyEvents', 'Emergency alerts', 'Your family can see when you ask for help.'],
  ['shareReminders', 'My reminders', 'Your family can see your reminders and whether you finished them.'],
  ['shareAppointments', 'My appointments', 'Your family can see your doctor visits and other appointments.'],
  ['shareGrocery', 'My grocery list', 'Your family can see what you need to buy.'],
  ['shareActivity', 'When I last used the app', 'Your family can see roughly when you were last active.'],
  ['allowLocationInEmergency', 'My location in an emergency', 'Your family sees where you are only if you tap "Share My Location" on the help screen.'],
];

export default function PrivacyControls() {
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => { api.get('/privacy').then((d) => setSettings(d.settings)).catch((e) => setError(e.message)); }, []);

  async function change(key, value) {
    const before = settings;
    setSettings({ ...settings, [key]: value }); // instant feedback
    setError(''); setSaved('');
    try {
      await api.put('/privacy', { [key]: value });
      setSaved('Saved. Your family will see this change.');
    } catch (e) {
      setSettings(before); // put the switch back
      setError(e.message);
    }
  }

  if (!settings) return error ? <ErrorNote>{error}</ErrorNote> : <Spinner label="Loading your privacy choices…" />;

  return (
    <div>
      <section className="card" aria-label="What your family can see">
        <h2 className="text-2xl font-bold">Your family can see…</h2>
        <p className="mt-1 text-lg text-muted">You decide. Switch anything off at any time.</p>
        <div className="mt-2">
          {ITEMS.map(([key, label, desc]) => <Toggle key={key} id={key} label={label} description={desc} checked={!!settings[key]} onChange={(v) => change(key, v)} />)}
        </div>
        <p role="status" aria-live="polite" className="mt-3 min-h-[1.75rem] text-lg font-bold text-success">{saved}</p>
        <ErrorNote>{error}</ErrorNote>
      </section>

      <section className="card mt-5 bg-canvas" aria-label="Never shared">
        <h2 className="flex items-center gap-2 text-2xl font-bold"><Lock aria-hidden size={26} /> Never shared</h2>
        <ul className="mt-3 space-y-3 text-xl">
          <li><b>Your photos and papers.</b> When you use the camera, the photo is sent to the AI to be read. ElderCare AI does not keep it, and your family never sees it.</li>
          <li><b>What you say and ask.</b> Your questions are not saved, and your family never sees them.</li>
        </ul>
      </section>
    </div>
  );
}
