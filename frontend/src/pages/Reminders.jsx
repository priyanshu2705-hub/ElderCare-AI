import { useCallback, useEffect, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';
import { addDaysYMD, friendlyDate, friendlyTime, localYMD } from '../utils/format.js';
import { ErrorNote, Field, PageHeader, Spinner } from '../components/ui.jsx';

const emptyForm = () => ({ title: '', day: 'today', date: localYMD(), time: '09:00' });

export default function Reminders() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get('/reminders?scope=upcoming')
      .then((d) => setItems(d.reminders))
      .catch((e) => { setError(e.message); setItems([]); });
  }, []);
  useEffect(load, [load]);

  const chooseDay = (day) => setForm((f) => ({ ...f, day, date: day === 'today' ? localYMD() : day === 'tomorrow' ? addDaysYMD(localYMD(), 1) : f.date }));

  async function toggle(r) {
    setError('');
    try { await api.put(`/reminders/${r._id}`, { status: r.status === 'done' ? 'pending' : 'done' }); load(); }
    catch (e) { setError(e.message); }
  }
  async function remove(r) {
    if (!window.confirm(`Delete "${r.title}"?`)) return;
    setError('');
    try { await api.del(`/reminders/${r._id}`); load(); } catch (e) { setError(e.message); }
  }
  async function save(e) {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) { setError('Please tell me what to remind you about.'); return; }
    setSaving(true);
    try {
      await api.post('/reminders', { title: form.title.trim(), date: form.date, time: form.time });
      setAdding(false); setForm(emptyForm()); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  // group by day
  const groups = (items || []).reduce((acc, r) => { (acc[r.date] ||= []).push(r); return acc; }, {});

  return (
    <div>
      <PageHeader title="My Reminders" />
      {!adding && <button type="button" className="btn-primary mb-6" onClick={() => setAdding(true)}><Plus aria-hidden /> Add a reminder</button>}

      {adding && (
        <form onSubmit={save} className="card mb-6" noValidate>
          <Field id="title" label="What should I remind you about?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} placeholder="e.g. Call my son" />
          <fieldset className="mb-5">
            <legend className="label">Which day?</legend>
            <div className="grid grid-cols-3 gap-2">
              {[['today', 'Today'], ['tomorrow', 'Tomorrow'], ['other', 'Pick day']].map(([v, t]) => (
                <label key={v} className={`btn-secondary !px-2 cursor-pointer ${form.day === v ? 'border-primary bg-info-bg' : ''}`}>
                  <input type="radio" name="day" className="sr-only" checked={form.day === v} onChange={() => chooseDay(v)} /> {t}
                </label>
              ))}
            </div>
            {form.day === 'other' && <input type="date" aria-label="Choose a day" className="field mt-3" min={localYMD()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />}
          </fieldset>
          <Field id="time" label="What time?" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          <ErrorNote>{error}</ErrorNote>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" className="btn-secondary" onClick={() => { setAdding(false); setError(''); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>Save</button>
          </div>
        </form>
      )}

      {!adding && <ErrorNote>{error}</ErrorNote>}
      {items === null && <Spinner label="Getting your reminders…" />}
      {items && items.length === 0 && !adding && (
        <p className="card text-center text-2xl">You have no reminders. <br /><span className="text-xl text-muted">Tap the button above, or ask me by voice on the home screen.</span></p>
      )}

      {Object.entries(groups).map(([date, list]) => (
        <section key={date} className="mb-6" aria-label={friendlyDate(date)}>
          <h2 className="mb-3 text-2xl font-bold">{friendlyDate(date)}</h2>
          <ul className="space-y-3">
            {list.map((r) => (
              <li key={r._id} className={`card flex items-center gap-3 !p-4 ${r.status === 'done' ? 'opacity-70' : ''}`}>
                <button type="button" onClick={() => toggle(r)} aria-label={r.status === 'done' ? `Mark ${r.title} as not done` : `Mark ${r.title} as done`}
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 ${r.status === 'done' ? 'border-success bg-success text-white' : 'border-line bg-surface'}`}>
                  {r.status === 'done' && <Check size={36} aria-hidden />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-2xl font-bold ${r.status === 'done' ? 'line-through' : ''}`}>{r.title}</p>
                  <p className="text-xl text-muted">{friendlyTime(r.time)}{r.status === 'done' ? ' · Done' : ''}</p>
                </div>
                <button type="button" onClick={() => remove(r)} aria-label={`Delete ${r.title}`} className="btn-small !min-h-[56px] !w-14 !px-0 text-danger"><Trash2 aria-hidden size={24} /></button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
