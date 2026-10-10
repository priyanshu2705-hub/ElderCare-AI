// Large on/off switch. Shows the words ON / OFF, so it never relies on colour alone.
export default function Toggle({ id, label, description, checked, onChange, disabled = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b-2 border-line py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <label id={`${id}-label`} htmlFor={id} className="block text-xl font-bold">{label}</label>
        {description && <p id={`${id}-desc`} className="mt-1 text-lg text-muted">{description}</p>}
      </div>
      <button id={id} type="button" role="switch" aria-checked={checked} disabled={disabled}
        aria-labelledby={`${id}-label`} aria-describedby={description ? `${id}-desc` : undefined}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 h-12 w-24 shrink-0 rounded-full border-4 transition disabled:opacity-60 ${checked ? 'border-success bg-success' : 'border-line bg-canvas'}`}>
        <span aria-hidden className={`absolute top-1/2 -translate-y-1/2 text-sm font-bold ${checked ? 'left-3 text-white' : 'right-3 text-ink'}`}>{checked ? 'ON' : 'OFF'}</span>
        <span aria-hidden className={`absolute top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border-2 border-line bg-white shadow ${checked ? 'right-1' : 'left-1'}`} />
      </button>
    </div>
  );
}
