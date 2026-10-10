import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ErrorNote, Field, Spinner } from '../components/ui.jsx';
import { homeFor } from '../components/RequireRole.jsx';

export default function Login() {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'elder' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = mode === 'login'
        ? await login(form.email, form.password)
        : await register({ name: form.name, email: form.email, password: form.password, role: form.role });
      nav(homeFor(u.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="mb-8 text-center">
        <p className="text-6xl" aria-hidden>🤝</p>
        <h1 className="mt-3 text-4xl font-bold">ElderCare AI</h1>
        <p className="mt-2 text-xl text-muted">Your simple assistant for everyday life.</p>
      </div>

      <form onSubmit={submit} className="card" noValidate>
        <h2 className="mb-5 text-2xl font-bold">{mode === 'login' ? 'Sign in' : 'Create your account'}</h2>

        {mode === 'register' && (
          <>
            <fieldset className="mb-5">
              <legend className="label">I am…</legend>
              <div className="grid grid-cols-2 gap-3">
                {[['elder', 'A senior'], ['caregiver', 'Family']].map(([v, t]) => (
                  <label key={v} className={`btn-secondary cursor-pointer ${form.role === v ? 'border-primary bg-info-bg' : ''}`}>
                    <input type="radio" name="role" value={v} checked={form.role === v} onChange={set('role')} className="sr-only" /> {t}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field id="name" label="Your name" value={form.name} onChange={set('name')} autoComplete="name" />
          </>
        )}
        <Field id="email" label="Email" type="email" value={form.email} onChange={set('email')} autoComplete="email" inputMode="email" />
        <Field id="password" label="Password" type="password" value={form.password} onChange={set('password')}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'} hint={mode === 'register' ? 'At least 8 characters.' : undefined} />

        <ErrorNote>{error}</ErrorNote>
        {busy ? <Spinner label="One moment…" /> : (
          <button type="submit" className="btn-primary mt-6">{mode === 'login' ? 'Sign in' : 'Create account'}</button>
        )}
        <button type="button" className="btn-small mt-4 w-full" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          {mode === 'login' ? 'New here? Create an account' : 'I already have an account'}
        </button>
      </form>

      <section className="mt-6 rounded-3xl border-2 border-dashed border-line p-5" aria-label="Demo accounts">
        <p className="kicker">Demo accounts (hackathon only)</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button type="button" className="btn-small" onClick={() => { setMode('login'); setForm((f) => ({ ...f, email: 'elder@example.com', password: 'Demo@1234' })); }}>👴 Senior</button>
          <button type="button" className="btn-small" onClick={() => { setMode('login'); setForm((f) => ({ ...f, email: 'family@example.com', password: 'Demo@1234' })); }}>👨‍👩‍👧 Family</button>
        </div>
        <p className="mt-3 text-base text-muted">These buttons fill in the demo login. Password: Demo@1234</p>
      </section>
    </main>
  );
}
