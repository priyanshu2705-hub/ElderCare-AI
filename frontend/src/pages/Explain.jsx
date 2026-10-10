import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { api } from '../services/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import useSpeech from '../hooks/useSpeech.js';
import { DemoBadge, ErrorNote, PageHeader, Spinner } from '../components/ui.jsx';

const EXAMPLE = 'Your annual premium is subject to revision in accordance with the applicable policy terms and conditions. Any revision will be communicated prior to the renewal date.';

// "Explain Simply": paste or type difficult words, get plain language back.
export default function Explain() {
  const { settings } = useSettings();
  const speech = useSpeech({ lang: settings.language, rate: settings.voiceSpeed, voiceEnabled: settings.voiceEnabled });
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function run() {
    if (!text.trim()) { setError('Please type or paste the words you want me to explain.'); return; }
    setBusy(true); setError(''); setResult(null); speech.stopSpeaking();
    try {
      const r = await api.post('/ai/explain', { text: text.trim() });
      setResult(r);
      speech.speak(r.simpleExplanation);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Explain Simply" back="/understand" subtitle="Paste difficult words and I will say them in plain language." />
      <label htmlFor="explain-text" className="label">The words to explain</label>
      <textarea id="explain-text" className="field" rows={7} maxLength={4000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste or type here…" />
      <div className="mt-4 space-y-3">
        <button type="button" className="btn-primary" onClick={run} disabled={busy}>Explain this simply</button>
        <button type="button" className="btn-small w-full" onClick={() => { setText(EXAMPLE); setResult(null); setError(''); }}>Try an example</button>
      </div>
      <ErrorNote>{error}</ErrorNote>
      {busy && <Spinner label="Making it simple…" />}

      {result && !busy && (
        <section className="card mt-6" aria-live="polite">
          {result.demoMode && <DemoBadge />}
          <p className="kicker">In simple words</p>
          <p className="mt-1 text-2xl leading-snug">{result.simpleExplanation}</p>
          {result.keyPoints?.length > 0 && (
            <div className="mt-4 rounded-2xl bg-info-bg p-4">
              <p className="text-xl font-bold">Important</p>
              <ul className="mt-2 list-disc space-y-2 pl-6 text-xl">{result.keyPoints.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          )}
          {result.amounts?.length > 0 && <p className="mt-4 text-xl"><b>Amounts:</b> {result.amounts.join(', ')}</p>}
          {result.dates?.length > 0 && <p className="mt-2 text-xl"><b>Dates:</b> {result.dates.join(', ')}</p>}
          <p className={`mt-4 text-xl font-bold ${result.actionRequired ? 'text-danger' : 'text-success'}`}>{result.actionRequired ? 'You may need to do something.' : 'Nothing to do right now.'}</p>
          {result.uncertainty && <p className="mt-3 rounded-xl bg-warn-bg p-3 text-lg text-warn-ink">{result.uncertainty}</p>}
          <button type="button" className="btn-secondary mt-5" onClick={() => speech.speak(result.simpleExplanation, { force: true })}><Volume2 aria-hidden /> Read it to me</button>
        </section>
      )}
    </div>
  );
}
