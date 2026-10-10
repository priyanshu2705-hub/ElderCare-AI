import { useDashboard } from '../../context/DashboardContext.jsx';
import { activityChip, emergencyStatus } from '../../utils/dashboard.js';
import { friendlyDate, friendlyTime } from '../../utils/format.js';
import NotShared from '../../components/NotShared.jsx';

const TONE = { ok: 'bg-success-bg text-success', warn: 'bg-warn-bg text-warn-ink', muted: 'bg-canvas text-muted', danger: 'bg-danger text-white' };

const Stat = ({ label, value, sub, tone }) => (
  <div className="card !rounded-2xl !p-4">
    <p className="kicker">{label}</p>
    <p className={`mt-1 text-3xl font-bold ${tone === 'danger' ? 'text-danger' : tone === 'ok' ? 'text-success' : ''}`}>{value}</p>
    {sub && <p className="mt-1 text-base text-muted">{sub}</p>}
  </div>
);

export default function Overview() {
  const { data } = useDashboard();
  const name = data.elder.name;
  const chip = activityChip(data.lastActiveAt, data.activity !== null);
  const emerg = emergencyStatus(data.emergencies);
  const s = data.summary;
  const next = data.appointments?.[0];

  return (
    <div className="space-y-6">
      <section className="card !rounded-2xl !p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="kicker">Looking after</p>
          <h1 className="text-3xl font-bold"><span aria-hidden>👴</span> {name}</h1>
        </div>
        <p className={`rounded-full px-4 py-2 text-lg font-bold ${TONE[chip.tone]}`}><span aria-hidden>{chip.tone === 'ok' ? '🟢 ' : chip.tone === 'warn' ? '🟡 ' : '⚪ '}</span>{chip.text}</p>
      </section>

      <section aria-label="Today at a glance" className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Today's reminders" value={s ? s.todayTotal : '—'} sub={s ? null : 'Not shared'} />
        <Stat label="Completed" value={s ? s.completed : '—'} tone="ok" sub={s ? null : 'Not shared'} />
        <Stat label="Pending" value={s ? s.pending : '—'} sub={s ? null : 'Not shared'} />
        <Stat label="Appointments" value={data.appointments ? data.appointments.length : '—'}
          sub={data.appointments ? (next ? `Next: ${friendlyDate(next.date)}, ${friendlyTime(next.time)}` : 'None coming up') : 'Not shared'} />
        <div className={`card !rounded-2xl !p-4 ${emerg.tone === 'danger' ? '!border-danger' : ''}`}>
          <p className="kicker">Emergency</p>
          <p className={`mt-2 inline-block rounded-full px-3 py-1 text-lg font-bold ${TONE[emerg.tone]}`}>{emerg.text}</p>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-label="Today's reminders">
          <h2 className="mb-2 text-xl font-bold">Today</h2>
          {data.reminders ? (
            (() => {
              const todays = data.reminders.filter((r) => r.date === data.today);
              return todays.length === 0 ? <p className="card !rounded-2xl !p-4 text-muted">No reminders today.</p> : (
                <ul className="card !rounded-2xl !p-4 space-y-2">
                  {todays.map((r) => <li key={r._id} className="flex justify-between gap-3 text-lg"><span>{r.status === 'done' ? '✅' : '🔔'} {r.title}</span><span className="text-muted">{friendlyTime(r.time)}</span></li>)}
                </ul>
              );
            })()
          ) : <NotShared name={name} what="reminders" />}
        </section>

        <section aria-label="Recent activity">
          <h2 className="mb-2 text-xl font-bold">Recent activity</h2>
          {data.activity ? (
            data.activity.length === 0 ? <p className="card !rounded-2xl !p-4 text-muted">Nothing yet.</p> : (
              <ul className="card !rounded-2xl !p-4 space-y-2">
                {data.activity.map((a) => <li key={a._id} className="flex justify-between gap-3 text-lg"><span>{a.summary}</span><span className="shrink-0 text-muted">{new Date(a.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</span></li>)}
              </ul>
            )
          ) : <NotShared name={name} what="their activity" />}
        </section>

        <section aria-label="Grocery list">
          <h2 className="mb-2 text-xl font-bold">🛒 Grocery list</h2>
          {data.grocery ? (
            data.grocery.length === 0 ? <p className="card !rounded-2xl !p-4 text-muted">Nothing needed.</p> : (
              <ul className="card !rounded-2xl !p-4 flex flex-wrap gap-2">
                {data.grocery.map((g) => <li key={g._id} className="rounded-full bg-canvas px-3 py-1 text-lg">{g.name}{g.quantity ? ` (${g.quantity})` : ''}</li>)}
              </ul>
            )
          ) : <NotShared name={name} what="their grocery list" />}
        </section>
      </div>
    </div>
  );
}
