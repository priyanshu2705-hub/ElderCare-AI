import { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Image as ImageIcon, Sparkles } from 'lucide-react';
import { api } from '../services/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useSession } from '../context/SessionContext.jsx';
import useSpeech from '../hooks/useSpeech.js';
import { shrinkImage } from '../utils/image.js';
import { friendlyDate, friendlyTime } from '../utils/format.js';
import { ErrorNote, PageHeader, Spinner } from '../components/ui.jsx';
import ResultCard from '../components/ResultCard.jsx';

const MAX_BYTES = 20 * 1024 * 1024; // before shrinking; the upload itself is far smaller

export default function Understand() {
  const { settings } = useSettings();
  const { setTopic } = useSession();
  const speech = useSpeech({ lang: settings.language, rate: settings.voiceSpeed, voiceEnabled: settings.voiceEnabled });
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [reminder, setReminder] = useState({ status: 'idle', message: '' });

  const reset = useCallback(() => {
    setPreview((p) => { if (p) URL.revokeObjectURL(p); return null; });
    setResult(null); setError(''); setReminder({ status: 'idle', message: '' });
    speech.stopSpeaking();
  }, [speech]);

  const show = useCallback((analysis) => {
    setResult(analysis);
    if (analysis.suggestedReminder) setTopic(analysis.suggestedReminder.title); // so "remind me tomorrow" works by voice
    speech.speak(analysis.simpleExplanation);
  }, [setTopic, speech]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same photo again
    if (!file) return;
    reset();
    if (!file.type.startsWith('image/')) { setError('That does not look like a photo. Please choose a picture.'); return; }
    if (file.size > MAX_BYTES) { setError('That photo is too big. Please try a smaller one.'); return; }
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      const blob = await shrinkImage(file).catch(() => { throw new Error("I couldn't open that photo. Please try a different one."); });
      const form = new FormData();
      form.append('image', blob, 'photo.jpg');
      show((await api.upload('/documents/analyze', form)).analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function trySample() {
    reset();
    setBusy(true);
    try { show((await api.post('/documents/analyze?sample=true', {})).analysis); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function remind() {
    const r = result.suggestedReminder;
    setReminder({ status: 'working', message: '' });
    try {
      await api.post('/reminders', { title: r.title, date: r.date, time: r.time, category: result.category === 'bill' ? 'bill' : 'general' });
      const msg = `Okay. I will remind you ${friendlyDate(r.date).toLowerCase()} at ${friendlyTime(r.time)}.`;
      setReminder({ status: 'done', message: msg });
      speech.speak(msg);
    } catch (err) {
      setReminder({ status: 'error', message: err.message });
    }
  }

  return (
    <div>
      <PageHeader title="Understand Something" subtitle="Take a photo and I will explain it in simple words." />

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleFile} tabIndex={-1} aria-hidden />
      <input ref={galleryRef} type="file" accept="image/*" className="sr-only" onChange={handleFile} tabIndex={-1} aria-hidden />

      {!busy && !result && (
        <div className="space-y-4">
          <button type="button" className="btn-primary !min-h-[96px] !text-2xl" onClick={() => cameraRef.current.click()}><Camera size={36} aria-hidden /> Take a photo</button>
          <button type="button" className="btn-secondary" onClick={() => galleryRef.current.click()}><ImageIcon aria-hidden /> Choose a photo</button>
          <button type="button" className="btn-small w-full" onClick={trySample}><Sparkles aria-hidden size={20} /> Try a sample bill (demo)</button>
          <Link to="/explain" className="btn-secondary">✍️ Paste words to explain simply</Link>
          <p className="text-center text-lg text-muted">Tip: use good light and hold the phone steady. Your photo is not saved.</p>
        </div>
      )}

      {preview && <img src={preview} alt="The photo you took" className="my-5 max-h-72 w-full rounded-3xl border-2 border-line object-contain bg-surface" />}
      {busy && <Spinner label="Reading your photo…" />}
      <ErrorNote>{error}</ErrorNote>
      {error && !busy && (
        <button type="button" className="btn-primary mt-4" onClick={() => { reset(); cameraRef.current.click(); }}><Camera aria-hidden /> Try again</button>
      )}

      {result && !busy && (
        <div className="mt-5">
          <ResultCard result={result} onListen={() => speech.speak(result.simpleExplanation, { force: true })}
            onRemind={remind} reminderState={reminder} onRetake={() => { reset(); cameraRef.current.click(); }} />
        </div>
      )}
    </div>
  );
}
