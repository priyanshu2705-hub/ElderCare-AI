import { useDashboard } from '../../context/DashboardContext.jsx';
import { mapsUrl, STATUS_TEXT, TRIGGER_TEXT } from '../../utils/dashboard.js';
import NotShared from '../../components/NotShared.jsx';

const BADGE = { active: 'bg-danger text-white', resolved: 'bg-success-bg text-success', cancelled: 'bg-canvas text-muted' };

export default function Emergency() {
  const { data } = useDashboard();
  const name = data.elder.name;
  return (
    <section aria-label="Emergency history">
      <h1 className="mb-1 text-2xl font-bold">Emergency alerts</h1>
      <p className="mb-4 text-lg text-muted">When {name} asks for help, it is saved here. This app does not call or text you automatically, so please call {name} if you see an active alert.</p>
      {!data.emergencies ? <NotShared name={name} what="emergency alerts" /> : data.emergencies.length === 0 ? <p className="card !rounded-2xl text-muted">No emergency alerts. 🙂</p> : (
        <ul className="space-y-3">
          {data.emergencies.map((e) => {
            const map = e.locationShared ? mapsUrl(e.location) : null;
            return (
              <li key={e.id} className={`card !rounded-2xl !p-4 ${e.status === 'active' ? '!border-danger' : ''}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xl font-bold">🚨 {name} requested assistance</p>
                  <span className={`rounded-full px-3 py-1 text-base font-bold ${BADGE[e.status]}`}>{STATUS_TEXT[e.status] || e.status}</span>
                </div>
                <dl className="mt-2 grid gap-x-6 gap-y-1 text-lg sm:grid-cols-[auto_1fr]">
                  <dt className="text-muted">Time</dt><dd>{new Date(e.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</dd>
                  <dt className="text-muted">How</dt><dd>{TRIGGER_TEXT[e.triggerType] || e.triggerType}</dd>
                  <dt className="text-muted">Location</dt>
                  <dd>{map ? <>Shared with permission · <a className="font-bold text-primary underline" href={map} target="_blank" rel="noopener noreferrer">View on map</a></> : 'Not shared'}</dd>
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
