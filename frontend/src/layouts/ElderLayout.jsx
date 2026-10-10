import { useCallback, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Spinner } from '../components/ui.jsx';
import ReminderAlert from '../components/ReminderAlert.jsx';
import useReminderAlarm from '../hooks/useReminderAlarm.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { api } from '../services/api.js';
import { speakNow } from '../utils/tts.js';

export default function ElderLayout() {
  const { settings, ready } = useSettings();
  const [due, setDue] = useState(null);
  const { voiceEnabled, language, voiceSpeed } = settings;

  const onDue = useCallback((r) => {
    setDue(r);
    if (voiceEnabled) speakNow(`Reminder. ${r.title}.`, { lang: language, rate: voiceSpeed });
  }, [voiceEnabled, language, voiceSpeed]);
  useReminderAlarm({ enabled: true, onDue });

  async function markDone() {
    try { await api.put(`/reminders/${due._id}`, { status: 'done' }); } catch { /* it will still show as pending in the list */ }
    setDue(null);
  }

  if (!ready) return <Spinner label="Loading…" />;
  if (!settings.onboardingDone) return <Navigate to="/onboarding" replace />;

  return (
    <div className="min-h-screen">
      <a href="#main" className="skip-link">Skip to main content</a>
      <main id="main" className="mx-auto max-w-2xl px-4 pb-20 pt-6"><Outlet /></main>
      {due && <ReminderAlert reminder={due} onDone={markDone} onClose={() => setDue(null)} />}
    </div>
  );
}
