import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { ErrorNote, Field } from '../components/ui.jsx';
import PrivacyControls from '../components/PrivacyControls.jsx';

const MODES = [
  ['voice', '🎤', 'Voice', 'Talk to me and I will talk back.', true],
  ['camera', '📷', 'Camera', 'Show me papers, medicines and labels.', true],
  ['text', '⌨️', 'Text', 'Type to me. I will show answers on screen and stay quiet.', false],
];
const TOTAL = 4;
const emptyContact = { name: '', relationship: '', phone: '', email: '', emergencyContact: true };

export default function Onboarding() {
  const nav = useNavigate();
  const { settings, update } = useSettings();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(settings.interactionMode || 'voice');
  const [contact, setContact] = useState(emptyContact);
  const [added, setAdded] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const heading = useRef(null);

  useEffect(() => { heading.current?.focus(); }, [step]); // screen readers hear each new step
  const set = (k) => (e) => setContact((c) => ({ ...c, [k]: e.target.value }));
  const go = (n) => { setError(''); setStep(n); };

  async function saveMode() {
    setBusy(true); setError('');
    try { await update({ interactionMode: mode, voiceEnabled: MODES.find((m) => m[0] === mode)[4] }); go(2); }
    catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function saveContact() {
    if (!contact.name.trim() || !contact.phone.trim()) { setError('Please enter a name and a phone number, or tap "Skip for now".'); return; }
    setBusy(true); setError('');
    try {
      await api.post('/trusted-contacts', { ...contact, name: contact.name.trim() });
      setAdded((a) => [...a, contact.name.trim()]);
      setContact({ ...emptyContact, emergencyContact: false });
      go(3);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  async function finish() {
    setBusy(true); setError('');
    try { await update({ onboardingDone: true }); nav('/', { replace: true }); }
    catch (e) { setError(e.message); setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-xl font-bold text-muted" aria-label={`Step ${step + 1} of ${TOTAL}`}>Step {step + 1} of {TOTAL}</p>
      <div className="mb-6 mt-2 flex gap-2" aria-hidden>{Array.from({ length: TOTAL }, (_, i) => <span key={i} className={`h-3 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-line'}`} />)}</div>

      {step === 0 && (
        <section className="text-center">
          <p className="text-8xl" aria-hidden>🤝</p>
          <h1 ref={heading} tabIndex={-1} className="mt-4 text-4xl font-bold">Welcome to ElderCare AI</h1>
          <p className="mt-3 text-2xl text-muted">Your simple assistant for everyday life.</p>
          <p className="mt-6 text-xl">I can read papers for you, remember things, and help you call family. It takes one minute to set up.</p>
          <button type="button" className="btn-primary mt-8 !min-h-[80px] !text-2xl" onClick={() => go(1)}>Let's start</button>
        </section>
      )}

      {step === 1 && (
        <section>
          <h1 ref={heading} tabIndex={-1} className="text-3xl font-bold">How would you like to talk to me?</h1>
          <p className="mt-2 text-xl text-muted">You can always use all three. This is just where we start.</p>
          <div role="radiogroup" aria-label="How would you like to interact" className="mt-6 space-y-3">
            {MODES.map(([v, icon, name, desc]) => (
              <button key={v} type="button" role="radio" aria-checked={mode === v} onClick={() => setMode(v)}
                className={`card flex w-full items-center gap-4 text-left ${mode === v ? '!border-primary bg-info-bg' : ''}`}>
                <span className="text-5xl" aria-hidden>{icon}</span>
                <span><span className="block text-2xl font-bold">{name}{mode === v ? ' ✓' : ''}</span><span className="block text-lg text-muted">{desc}</span></span>
              </button>
            ))}
          </div>
          <ErrorNote>{error}</ErrorNote>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" className="btn-secondary" onClick={() => go(0)}>Back</button>
            <button type="button" className="btn-primary" onClick={saveMode} disabled={busy}>Next</button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h1 ref={heading} tabIndex={-1} className="text-3xl font-bold">Who can I call for you?</h1>
          <p className="mt-2 text-xl text-muted">Add someone you trust. They will be shown when you ask for help.</p>
          {added.length > 0 && <p role="status" className="mt-4 rounded-2xl bg-success-bg p-3 text-xl font-bold text-success">✓ Added: {added.join(', ')}</p>}
          <div className="card mt-5">
            <Field id="c-name" label="Name" value={contact.name} onChange={set('name')} autoComplete="off" />
            <Field id="c-rel" label="Who are they to you?" value={contact.relationship} onChange={set('relationship')} placeholder="e.g. Son, Daughter, Neighbour" />
            <Field id="c-phone" label="Phone number" type="tel" inputMode="tel" value={contact.phone} onChange={set('phone')} placeholder="+91 …" />
            <Field id="c-email" label="Email (optional)" type="email" value={contact.email} onChange={set('email')} hint="If they have an ElderCare family account with this email, they can see what you choose to share." />
          </div>
          <ErrorNote>{error}</ErrorNote>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" className="btn-secondary" onClick={() => go(3)}>Skip for now</button>
            <button type="button" className="btn-primary" onClick={saveContact} disabled={busy}>Save and continue</button>
          </div>
          <button type="button" className="btn-small mt-3 w-full" onClick={() => go(1)}>Back</button>
        </section>
      )}

      {step === 3 && (
        <section>
          <h1 ref={heading} tabIndex={-1} className="text-3xl font-bold">You decide what your family can see</h1>
          <p className="mb-5 mt-2 text-xl text-muted">Nothing is shared unless you allow it. You can change this any time in Settings.</p>
          <PrivacyControls />
          <ErrorNote>{error}</ErrorNote>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" className="btn-secondary" onClick={() => go(2)}>Back</button>
            <button type="button" className="btn-success" onClick={finish} disabled={busy}>All done</button>
          </div>
        </section>
      )}
    </main>
  );
}
