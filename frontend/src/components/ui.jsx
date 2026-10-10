import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';

export function PageHeader({ title, back = '/', subtitle }) {
  return (
    <header className="mb-6">
      {back && (
        <Link to={back} className="btn-small mb-4 w-fit" aria-label="Go back to the home screen">
          <ArrowLeft aria-hidden size={22} /> Back
        </Link>
      )}
      <h1 className="text-3xl font-bold leading-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-xl text-muted">{subtitle}</p>}
    </header>
  );
}

export function Spinner({ label = 'Please wait…' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-6 text-xl font-bold">
      <Loader2 aria-hidden className="animate-spin" size={28} /> {label}
    </div>
  );
}

// Errors are announced to screen readers (role="alert")
export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <div role="alert" className="mt-4 flex items-start gap-3 rounded-2xl border-2 border-danger bg-surface p-4 text-lg font-bold text-danger">
      <AlertTriangle aria-hidden className="mt-1 shrink-0" size={24} /> <span>{children}</span>
    </div>
  );
}

// Shown whenever a response did NOT come from a real AI model
export function DemoBadge({ children = 'Demo mode: simple built-in answers, not the full AI.' }) {
  return <p className="mt-3 inline-block rounded-xl bg-warn-bg px-3 py-1 text-base font-bold text-warn-ink">{children}</p>;
}

export function Field({ id, label, hint, ...props }) {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} className="field" {...props} />
      {hint && <p className="mt-1 text-base text-muted">{hint}</p>}
    </div>
  );
}
