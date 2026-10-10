import { useDashboard } from '../../context/DashboardContext.jsx';
import { privacyLabel } from '../../utils/dashboard.js';

const PILL = { ok: 'bg-success-bg text-success', warn: 'bg-warn-bg text-warn-ink', muted: 'bg-canvas text-muted' };

export default function Privacy() {
  const { data } = useDashboard();
  const name = data.elder.name;
  return (
    <section aria-label="What is shared">
      <h1 className="text-2xl font-bold">What {name} shares with you</h1>
      <p className="mb-4 mt-1 text-lg text-muted">{name} is in control. You do not automatically see everything, and only {name} can change this list.</p>
      <div className="card !rounded-2xl !p-0 overflow-x-auto">
        <table className="w-full min-w-[360px] text-left text-lg">
          <caption className="sr-only">Information shared with family</caption>
          <thead className="border-b-2 border-line text-base text-muted"><tr><th scope="col" className="p-4">Information</th><th scope="col" className="p-4">Shared?</th></tr></thead>
          <tbody>
            {data.privacy.map((p) => {
              const [icon, text, tone] = privacyLabel[p.status];
              return (
                <tr key={p.key} className="border-b border-line last:border-b-0">
                  <th scope="row" className="p-4 font-bold">{p.label}</th>
                  <td className="p-4"><span className={`rounded-full px-3 py-1 text-base font-bold ${PILL[tone]}`}><span aria-hidden>{icon} </span>{text}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-base text-muted">Photos, documents and conversations are never stored by ElderCare AI, so they can never be shared.</p>
    </section>
  );
}
