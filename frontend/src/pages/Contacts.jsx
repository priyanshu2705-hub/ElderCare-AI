import { useCallback, useEffect, useState } from 'react';
import { Phone, Plus, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';
import { ErrorNote, Field, PageHeader, Spinner } from '../components/ui.jsx';

const empty = { name: '', relationship: '', phone: '', email: '', emergencyContact: true };

export default function Contacts() {
  const [items, setItems] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get('/trusted-contacts').then((d) => setItems(d.contacts)).catch((e) => { setError(e.message); setItems([]); });
  }, []);
  useEffect(load, [load]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Please enter a name.'); return; }
    setSaving(true);
    try {
      await api.post('/trusted-contacts', { ...form, name: form.name.trim() });
      setAdding(false); setForm(empty); load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  async function remove(c) {
    if (!window.confirm(`Remove ${c.name}?`)) return;
    try { await api.del(`/trusted-contacts/${c._id}`); load(); } catch (e) { setError(e.message); }
  }

  return (
    <div>
      <PageHeader title="Family & Trusted Contacts" subtitle="These people will be shown when you ask for help." />
      {!adding && <button type="button" className="btn-primary mb-6" onClick={() => setAdding(true)}><Plus aria-hidden /> Add a person</button>}

      {adding && (
        <form onSubmit={save} className="card mb-6" noValidate>
          <Field id="name" label="Name" value={form.name} onChange={set('name')} autoComplete="off" />
          <Field id="rel" label="Who are they to you?" value={form.relationship} onChange={set('relationship')} placeholder="e.g. Son, Daughter, Neighbour" />
          <Field id="phone" label="Phone number" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} placeholder="+91 …" />
          <Field id="email" label="Email (optional)" type="email" value={form.email} onChange={set('email')}
            hint="If they have an ElderCare family account with this email, they can see what you choose to share." />
          <label className="mb-2 flex items-center gap-3 text-xl font-bold">
            <input type="checkbox" className="h-8 w-8" checked={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.checked })} />
            Call this person first in an emergency
          </label>
          <ErrorNote>{error}</ErrorNote>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button type="button" className="btn-secondary" onClick={() => { setAdding(false); setError(''); }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>Save</button>
          </div>
        </form>
      )}

      {!adding && <ErrorNote>{error}</ErrorNote>}
      {items === null && <Spinner />}
      {items && items.length === 0 && !adding && <p className="card text-center text-2xl">No one added yet.</p>}
      <ul className="space-y-3">
        {items?.map((c) => (
          <li key={c._id} className="card flex items-center gap-3 !p-4">
            <div className="min-w-0 flex-1">
              <p className="text-2xl font-bold">{c.name}</p>
              <p className="text-xl text-muted">{[c.relationship, c.emergencyContact && 'First to call'].filter(Boolean).join(' · ')}</p>
              <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} className="mt-1 inline-flex items-center gap-2 text-xl font-bold text-primary underline"><Phone aria-hidden size={20} /> {c.phone}</a>
            </div>
            <button type="button" onClick={() => remove(c)} aria-label={`Remove ${c.name}`} className="btn-small !min-h-[56px] !w-14 !px-0 text-danger"><Trash2 aria-hidden size={24} /></button>
          </li>
        ))}
      </ul>
    </div>
  );
}
