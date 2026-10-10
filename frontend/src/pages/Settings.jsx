import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, LogOut, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { speakNow } from '../utils/tts.js';
import { ErrorNote, PageHeader } from '../components/ui.jsx';
import Toggle from '../components/Toggle.jsx';

const SIZES = [['large', 'Large'], ['xlarge', 'Extra large'], ['xxlarge', 'Huge']];
const SPEEDS = [[0.7, 'Slow'], [0.9, 'Normal'], [1.1, 'Fast']];

function Choice({ legend, options, value, onPick }) {
  return (
    <fieldset className="py-4">
      <legend className="mb-3 text-xl font-bold">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="grid grid-cols-3 gap-2">
        {options.map(([v, t]) => (
          <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onPick(v)}
            className={`btn-secondary !px-2 !text-lg ${value === v ? '!border-primary bg-info-bg' : ''}`}>{t}{value === v ? ' ✓' : ''}</button>
        ))}
      </div>
    </fieldset>
  );
}

export default function Settings() {
  const { logout } = useAuth();
  const { settings, update } = useSettings();
  const [error, setError] = useState('');

  const change = async (patch) => {
    setError('');
    try { await update(patch); } catch (e) { setError(e.message); }
  };
  const nearestSpeed = SPEEDS.reduce((best, [v]) => (Math.abs(v - settings.voiceSpeed) < Math.abs(best - settings.voiceSpeed) ? v : best), 0.9);

  return (
    <div>
      <PageHeader title="Settings" />

      <section className="card" aria-label="Accessibility">
        <h2 className="text-2xl font-bold">Make it easier to see and hear</h2>
        <Choice legend="Text size" options={SIZES} value={settings.textSize} onPick={(v) => change({ textSize: v })} />
        <div className="border-t-2 border-line">
          <Toggle id="highContrast" label="High contrast" description="Black and white, with thick lines. Easier to see." checked={settings.highContrast} onChange={(v) => change({ highContrast: v })} />
          <Toggle id="voiceEnabled" label="Speak answers aloud" description="I will read my answers to you." checked={settings.voiceEnabled} onChange={(v) => change({ voiceEnabled: v })} />
        </div>
        <div className="border-t-2 border-line">
          <Choice legend="How fast I speak" options={SPEEDS} value={nearestSpeed} onPick={(v) => change({ voiceSpeed: v })} />
        </div>
        <button type="button" className="btn-secondary" onClick={() => speakNow('Hello. This is how I will sound.', { lang: settings.language, rate: settings.voiceSpeed })}>
          <Volume2 aria-hidden /> Test my voice
        </button>
        <ErrorNote>{error}</ErrorNote>
      </section>

      <nav className="mt-5 space-y-3" aria-label="More settings">
        {[['/privacy', '🔒', 'Privacy', 'Choose what your family can see'], ['/contacts', '👨‍👩‍👧', 'Family & trusted contacts', 'Who I can call for you'], ['/onboarding', '👋', 'Welcome tour', 'Go through the first-time setup again']].map(([to, icon, title, desc]) => (
          <Link key={to} to={to} className="card flex items-center gap-4 hover:bg-canvas">
            <span className="text-4xl" aria-hidden>{icon}</span>
            <span className="flex-1"><span className="block text-xl font-bold">{title}</span><span className="block text-lg text-muted">{desc}</span></span>
            <ChevronRight aria-hidden size={28} />
          </Link>
        ))}
      </nav>
      <button type="button" onClick={logout} className="btn-secondary mt-8"><LogOut aria-hidden /> Sign out</button>
    </div>
  );
}
