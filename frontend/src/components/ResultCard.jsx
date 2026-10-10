import { Bell, Camera, Volume2 } from 'lucide-react';
import { DemoBadge } from './ui.jsx';

const Row = ({ label, children, big }) => (
  <div className="border-b-2 border-line py-4 last:border-b-0">
    <p className="kicker">{label}</p>
    <p className={big ? 'mt-1 text-4xl font-bold' : 'mt-1 text-2xl font-bold'}>{children}</p>
  </div>
);

/** Shows the AI's answer about a photo: What is this? / Amount / Due date / What should I do? */
export default function ResultCard({ result, onListen, onRemind, reminderState, onRetake }) {
  if (result.needsRetake) {
    return (
      <section className="card border-warn-ink bg-warn-bg" aria-live="polite">
        <h2 className="text-2xl font-bold text-warn-ink">I need a clearer photo</h2>
        <p className="mt-3 text-2xl">{result.simpleExplanation}</p>
        {result.unreadableParts?.length > 0 && <p className="mt-3 text-lg text-muted">Hard to read: {result.unreadableParts.join(', ')}</p>}
        <button type="button" onClick={onRetake} className="btn-primary mt-6"><Camera aria-hidden /> Take another photo</button>
      </section>
    );
  }

  const unsure = result.confidence < 0.7;
  return (
    <section className="card" aria-live="polite">
      {result.demoNote && <DemoBadge>{result.demoNote}</DemoBadge>}

      <Row label="What is this?">{result.documentType}</Row>
      {result.amount && <Row label="Amount" big>{result.amount}</Row>}
      {result.dueDate && <Row label="Due date" big>{result.dueDate}</Row>}

      <div className="py-4">
        <p className="kicker">In simple words</p>
        <p className="mt-1 text-2xl leading-snug">{result.simpleExplanation}</p>
      </div>

      {result.importantPoints?.length > 0 && (
        <div className="rounded-2xl bg-info-bg p-4">
          <p className="text-xl font-bold">What should I do?</p>
          <ul className="mt-2 list-disc space-y-2 pl-6 text-xl">
            {result.importantPoints.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      )}

      <p className={`mt-4 text-xl font-bold ${result.actionRequired ? 'text-danger' : 'text-success'}`}>
        {result.actionRequired ? 'You need to do something about this.' : 'Nothing to do right now.'}
      </p>

      {result.unreadableParts?.length > 0 && (
        <p className="mt-3 rounded-xl bg-warn-bg p-3 text-lg text-warn-ink">I could not read: {result.unreadableParts.join(', ')}.</p>
      )}
      {unsure && <p className="mt-3 rounded-xl bg-warn-bg p-3 text-lg text-warn-ink">I am not fully sure about this. Please check with someone you trust.</p>}
      {result.safetyNote && <p className="mt-3 rounded-xl bg-warn-bg p-3 text-lg font-bold text-warn-ink">{result.safetyNote}</p>}

      <div className="mt-6 space-y-3">
        <button type="button" onClick={onListen} className="btn-secondary"><Volume2 aria-hidden /> Read it to me</button>
        {result.suggestedReminder && (
          <button type="button" onClick={onRemind} disabled={reminderState.status === 'working' || reminderState.status === 'done'} className="btn-primary">
            <Bell aria-hidden /> {reminderState.status === 'done' ? 'Reminder saved' : 'Remind me'}
          </button>
        )}
        {reminderState.message && <p role="status" className={`text-xl font-bold ${reminderState.status === 'error' ? 'text-danger' : 'text-success'}`}>{reminderState.message}</p>}
        <button type="button" onClick={onRetake} className="btn-secondary"><Camera aria-hidden /> Try another photo</button>
      </div>
    </section>
  );
}
