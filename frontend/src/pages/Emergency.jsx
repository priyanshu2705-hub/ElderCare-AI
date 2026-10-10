import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Phone } from 'lucide-react';
import { api } from '../services/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { speakNow } from '../utils/tts.js';
import { ErrorNote, Spinner } from '../components/ui.jsx';

const FALLBACK_NUMBERS = { national: '112', ambulance: '108' };

const CallButton = ({ href, children, tone = 'btn-primary' }) => (
  <a href={href} className={`${tone} !min-h-[80px] !text-2xl`}><Phone aria-hidden size={30} /> {children}</a>
);

export default function Emergency() {
  const nav = useNavigate();
  const { state } = useLocation();
  const { settings } = useSettings();
  const [stage, setStage] = useState('confirm'); // confirm -> active
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loc, setLoc] = useState({ status: 'idle', msg: '' });
  const say = (t) => settings.voiceEnabled && speakNow(t, { lang: settings.language, rate: settings.voiceSpeed });

  useEffect(() => { say('Are you in immediate danger?'); /* eslint-disable-next-line */ }, []);

  async function confirmHelp() {
    setBusy(true);
    setError('');
    try {
      const d = await api.post('/emergency/trigger', { triggerType: state?.triggerType || 'button' });
      setData(d);
      say('I saved your help request. Please call your family or one one two now. No message was sent automatically.');
    } catch (e) {
      // Even if the server cannot be reached, the phone-call buttons must still appear.
      let contacts = [];
      try { contacts = (await api.get('/trusted-contacts')).contacts; } catch { /* offline */ }
      setData({ offline: true, contacts, emergencyNumbers: FALLBACK_NUMBERS,
        notice: `I could not save your help request. ${e.message} Please call for help now.` });
      say('I could not save your help request, but you can still call for help now.');
    } finally {
      setStage('active');
      setBusy(false);
    }
  }

  function shareLocation() {
    if (!data?.event) return;
    if (!navigator.geolocation) { setLoc({ status: 'error', msg: 'This device cannot share its location. You can still call.' }); return; }
    setLoc({ status: 'working', msg: '' });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api.put(`/emergency/${data.event._id}`, { locationShared: true, location: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy } });
          setLoc({ status: 'done', msg: 'Your location was saved with this help request.' });
        } catch (e) { setLoc({ status: 'error', msg: e.message }); }
      },
      (err) => setLoc({ status: 'error', msg: err.code === 1 ? 'Location is turned off for this app. You can still call.' : 'I could not find your location. You can still call.' }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function cancelAlert() {
    if (data?.event) { try { await api.put(`/emergency/${data.event._id}`, { status: 'cancelled' }); } catch { /* still go home */ } }
    nav('/');
  }

  /* ---------- Step 1: are you in danger? ---------- */
  if (stage === 'confirm') {
    return (
      <div className="text-center">
        <p className="text-7xl" aria-hidden>🆘</p>
        <h1 className="mt-4 text-4xl font-bold leading-tight">Are you in immediate danger?</h1>
        <div className="mt-8 space-y-4">
          <button type="button" onClick={confirmHelp} disabled={busy} className="btn-danger !min-h-[96px] !text-3xl">YES — GET HELP</button>
          <Link to="/" className="btn-secondary !min-h-[80px] !text-2xl">NO — CANCEL</Link>
        </div>
        {busy && <Spinner label="Getting help ready…" />}
        <ErrorNote>{error}</ErrorNote>
        <p className="mt-8 text-xl text-muted">Not sure? You can call emergency services directly:</p>
        <div className="mt-3"><CallButton href={`tel:${FALLBACK_NUMBERS.national}`} tone="btn-secondary">Call 112</CallButton></div>
      </div>
    );
  }

  /* ---------- Step 2: options ---------- */
  const numbers = data.emergencyNumbers || FALLBACK_NUMBERS;
  return (
    <div>
      <h1 className="text-4xl font-bold leading-tight"><span aria-hidden>🚨</span> Emergency help</h1>
      <p className="mt-2 text-2xl text-muted">What would you like to do?</p>

      <div role="status" className={`mt-5 rounded-2xl p-4 text-xl font-bold ${data.offline ? 'bg-warn-bg text-warn-ink' : 'bg-info-bg'}`}>
        {data.notice}
        {data.event && <span className="mt-2 block text-lg font-normal">Saved at {new Date(data.event.timestamp).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}.</span>}
      </div>

      <section className="mt-6 space-y-3" aria-label="Call someone">
        {data.contacts?.length > 0 ? data.contacts.map((c) => (
          <CallButton key={c.id || c._id || c.phone} href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}>Call {c.name}{c.relationship ? ` (${c.relationship})` : ''}</CallButton>
        )) : (
          <p className="card text-xl">You have not added a family contact yet. <Link to="/contacts" className="font-bold text-primary underline">Add one now</Link>.</p>
        )}
        <CallButton href={`tel:${numbers.national}`} tone="btn-danger">Emergency Services ({numbers.national})</CallButton>
        <CallButton href={`tel:${numbers.ambulance}`} tone="btn-danger">Ambulance ({numbers.ambulance})</CallButton>
      </section>

      {data.event && (
        <section className="mt-6" aria-label="Share location">
          <button type="button" onClick={shareLocation} disabled={loc.status === 'working' || loc.status === 'done'} className="btn-secondary !min-h-[80px] !text-2xl">
            <MapPin aria-hidden size={30} /> {loc.status === 'done' ? 'Location shared' : 'Share My Location'}
          </button>
          <p className="mt-2 text-lg text-muted">Your phone will ask for permission first. Your location is only saved with this help request.</p>
          {loc.status === 'working' && <Spinner label="Finding where you are…" />}
          {loc.msg && <p role="status" className={`mt-3 text-xl font-bold ${loc.status === 'error' ? 'text-danger' : 'text-success'}`}>{loc.msg}</p>}
        </section>
      )}

      <button type="button" onClick={cancelAlert} className="btn-secondary mt-8">❌ I am okay — cancel</button>
      <p className="mt-6 text-center text-base text-muted">ElderCare AI does not replace doctors, family or emergency services. In India, call 112.</p>
    </div>
  );
}
