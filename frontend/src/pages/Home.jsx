import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Camera, ChevronRight, LogOut, Mic, Send, Square, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useSession } from '../context/SessionContext.jsx';
import useSpeech from '../hooks/useSpeech.js';
import { api } from '../services/api.js';
import { friendlyDate, friendlyTime, greeting } from '../utils/format.js';
import { DemoBadge, ErrorNote, Spinner } from '../components/ui.jsx';

const HINTS = ['What do I need to do today?', 'Remind me to call my son at 7 PM', 'What does this paper say?', 'Add milk to my grocery list'];

export default function Home() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { topic, setTopic } = useSession();
  const nav = useNavigate();
  const speech = useSpeech({ lang: settings.language, rate: settings.voiceSpeed, voiceEnabled: settings.voiceEnabled });

  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null); // reminders still to do today
  const [hint] = useState(() => HINTS[Math.floor(Math.random() * HINTS.length)]);

  const loadCount = useCallback(() => {
    api.get('/reminders?scope=today')
      .then(({ reminders }) => setPending(reminders.filter((r) => r.status === 'pending').length))
      .catch(() => setPending(null));
  }, []);
  useEffect(loadCount, [loadCount]);

  const ask = useCallback(async (text) => {
    const q = text.trim();
    if (!q) return;
    setBusy(true);
    setError('');
    setResponse(null);
    speech.stopSpeaking();
    try {
      const data = await api.post('/ai/chat', { text: q, topic: topic || undefined });
      setResponse({ ...data, heard: q });
      speech.speak(data.reply);
      if (data.action?.type === 'OPEN_EMERGENCY') {
        nav('/emergency', { state: { triggerType: data.action.triggerType || 'voice' } });
        return;
      }
      if (data.tool?.ok && data.tool.name === 'createReminder') { setTopic(''); loadCount(); }
    } catch (e) {
      setError(e.message);
      speech.speak(e.message);
    } finally {
      setBusy(false);
      setTyped('');
    }
  }, [speech, topic, setTopic, nav, loadCount]);

  const onMic = () => (speech.listening ? speech.stopListening() : speech.listen(ask));
  const status = speech.listening ? 'I am listening… please speak now.' : busy ? 'Thinking…' : speech.supported ? 'TAP TO SPEAK' : 'Type your question below';

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-4xl font-bold leading-tight">{greeting()}, {user.name} <span aria-hidden>👋</span></h1>
        <p className="mt-2 text-2xl text-muted">How can I help you?</p>
      </header>

      {/* ---- Voice: the main interaction ---- */}
      <section className="card text-center" aria-label="Ask me anything">
        <div className="relative mx-auto my-4 h-44 w-44">
          <button type="button" onClick={onMic} disabled={busy || !speech.supported}
            aria-label={speech.listening ? 'Stop listening' : 'Start speaking'} aria-pressed={speech.listening}
            className={`relative z-10 flex h-44 w-44 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition hover:bg-primary-dark disabled:opacity-50 ${speech.listening ? 'pulse-ring' : ''}`}>
            {speech.listening ? <Square size={64} aria-hidden fill="currentColor" /> : <Mic size={80} aria-hidden />}
          </button>
        </div>
        <p role="status" aria-live="polite" className="text-2xl font-bold">{status}</p>
        {speech.interim && <p className="mt-3 text-2xl italic text-muted">“{speech.interim}”</p>}
        {!speech.supported && <p className="mt-2 text-lg text-muted">Voice works best in Google Chrome or Microsoft Edge.</p>}
        <ErrorNote>{speech.error}</ErrorNote>

        {/* Always-visible typing fallback */}
        <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(typed); }}>
          <label htmlFor="typed" className="sr-only">Type your question</label>
          <input id="typed" className="field flex-1" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={`Or type here… e.g. ${hint}`} maxLength={500} />
          <button type="submit" className="btn-primary !w-auto px-5" aria-label="Send" disabled={busy || !typed.trim()}><Send aria-hidden /></button>
        </form>
      </section>

      {busy && <Spinner label="Thinking…" />}
      <ErrorNote>{error}</ErrorNote>

      {response && !busy && (
        <section className="card mt-5 border-primary" aria-live="polite">
          <p className="kicker">You said: “{response.heard}”</p>
          <p className="mt-3 text-3xl font-bold leading-snug">{response.reply}</p>
          {response.tool?.ok && response.tool.name === 'createReminder' && response.tool.data && (
            <p className="mt-4 rounded-2xl bg-success-bg p-4 text-xl font-bold text-success">
              ✓ Saved: {response.tool.data.title}, {friendlyDate(response.tool.data.date).toLowerCase()} at {friendlyTime(response.tool.data.time)}
            </p>
          )}
          {response.demoMode && <DemoBadge />}
          <div className="mt-5 space-y-3">
            {response.action?.type === 'OPEN_CAMERA' && <Link to="/understand" className="btn-primary"><Camera aria-hidden /> Take a photo</Link>}
            {speech.speaking
              ? <button type="button" onClick={speech.stopSpeaking} className="btn-secondary"><Square aria-hidden size={22} /> Stop talking</button>
              : <button type="button" onClick={() => speech.speak(response.reply, { force: true })} className="btn-secondary"><Volume2 aria-hidden /> Listen again</button>}
          </div>
        </section>
      )}

      {/* ---- Big, simple choices ---- */}
      <nav className="mt-6 space-y-4" aria-label="Main choices">
        <Link to="/understand" className="card flex items-center gap-5 hover:bg-canvas">
          <Camera size={52} className="shrink-0 text-primary" aria-hidden />
          <span className="flex-1">
            <span className="block text-2xl font-bold">Understand Something</span>
            <span className="mt-1 block text-lg text-muted">Take a photo of a bill, paper, medicine, label or appliance.</span>
          </span>
          <ChevronRight aria-hidden size={32} />
        </Link>
        <Link to="/reminders" className="card flex items-center gap-5 hover:bg-canvas">
          <Bell size={52} className="shrink-0 text-primary" aria-hidden />
          <span className="flex-1">
            <span className="block text-2xl font-bold">Today's Reminders</span>
            <span className="mt-1 block text-lg text-muted">
              {pending === null ? 'Tap to see your reminders' : pending === 0 ? 'Nothing left to do today' : `${pending} reminder${pending === 1 ? '' : 's'} to do`}
            </span>
          </span>
          <ChevronRight aria-hidden size={32} />
        </Link>
        <Link to="/emergency" className="flex min-h-[96px] items-center justify-center gap-4 rounded-3xl bg-danger px-6 py-5 text-3xl font-bold text-white shadow-lg hover:bg-danger-dark" aria-label="I need help. Open emergency help.">
          <span aria-hidden className="text-5xl">🆘</span> I NEED HELP
        </Link>
      </nav>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 text-lg">
        <Link to="/settings" className="btn-small">⚙️ Settings</Link>
        <Link to="/contacts" className="btn-small">Family contacts</Link>
        <button type="button" onClick={logout} className="btn-small"><LogOut aria-hidden size={20} /> Sign out</button>
      </footer>
      <p className="mt-6 text-center text-base text-muted">ElderCare AI does not replace doctors, family or emergency services.</p>
    </div>
  );
}
