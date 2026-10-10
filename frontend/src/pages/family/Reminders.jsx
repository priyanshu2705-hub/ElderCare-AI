import { useDashboard } from '../../context/DashboardContext.jsx';
import { friendlyDate, friendlyTime } from '../../utils/format.js';
import NotShared from '../../components/NotShared.jsx';

const Status = ({ done }) => (
  <span className={`rounded-full px-3 py-1 text-base font-bold ${done ? 'bg-success-bg text-success' : 'bg-warn-bg text-warn-ink'}`}>{done ? '✓ Done' : 'Pending'}</span>
);

export default function Reminders() {
  const { data } = useDashboard();
  const name = data.elder.name;
  return (
    <div className="space-y-8">
      <section aria-label="Reminders">
        <h1 className="mb-3 text-2xl font-bold">Reminders</h1>
        {!data.reminders ? <NotShared name={name} what="reminders" /> : data.reminders.length === 0 ? <p className="card !rounded-2xl text-muted">No reminders.</p> : (
          <div className="card !rounded-2xl !p-0 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-lg">
              <caption className="sr-only">{name}'s reminders</caption>
              <thead className="border-b-2 border-line text-base text-muted"><tr><th scope="col" className="p-4">Reminder</th><th scope="col" className="p-4">Date</th><th scope="col" className="p-4">Time</th><th scope="col" className="p-4">Status</th></tr></thead>
              <tbody>
                {data.reminders.map((r) => (
                  <tr key={r._id} className="border-b border-line last:border-b-0">
                    <th scope="row" className="p-4 font-bold">{r.title}</th>
                    <td className="p-4">{friendlyDate(r.date)}</td>
                    <td className="p-4">{friendlyTime(r.time)}</td>
                    <td className="p-4"><Status done={r.status === 'done'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-label="Appointments">
        <h2 className="mb-3 text-2xl font-bold">📅 Appointments</h2>
        {!data.appointments ? <NotShared name={name} what="appointments" /> : data.appointments.length === 0 ? <p className="card !rounded-2xl text-muted">No appointments coming up.</p> : (
          <ul className="space-y-3">
            {data.appointments.map((a) => (
              <li key={a._id} className="card !rounded-2xl !p-4">
                <p className="text-xl font-bold">{a.title}</p>
                <p className="text-lg text-muted">{friendlyDate(a.date)} at {friendlyTime(a.time)}{a.location ? ` · ${a.location}` : ''}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
