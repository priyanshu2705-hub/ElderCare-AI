import { NavLink, Outlet } from 'react-router-dom';
import { LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { DashboardProvider, useDashboard } from '../context/DashboardContext.jsx';
import { latestActiveAlert, TRIGGER_TEXT } from '../utils/dashboard.js';
import { ErrorNote, Spinner } from '../components/ui.jsx';

const TABS = [['/family', 'Overview', true], ['/family/reminders', 'Reminders', false], ['/family/emergency', 'Emergency', false], ['/family/privacy', 'Privacy', false]];

function Shell() {
  const { user, logout } = useAuth();
  const { elders, elderId, select, data, error, updatedAt, refresh } = useDashboard();
  const alert = latestActiveAlert(data?.emergencies);

  return (
    <div className="min-h-screen">
      <a href="#dash" className="skip-link">Skip to dashboard</a>
      <header className="border-b-2 border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="text-xl font-bold"><span aria-hidden>🤝</span> ElderCare AI <span className="font-normal text-muted">· Family</span></p>
          <div className="flex flex-wrap items-center gap-2">
            {elders && elders.length > 1 && (
              <select aria-label="Choose who to view" className="field !min-h-[44px] !w-auto !py-1 !text-base" value={elderId || ''} onChange={(e) => select(e.target.value)}>
                {elders.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            )}
            <button type="button" className="btn-small" onClick={refresh} aria-label="Refresh now"><RefreshCw aria-hidden size={18} /> {updatedAt ? `Updated ${updatedAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : 'Refresh'}</button>
            <button type="button" className="btn-small" onClick={logout}><LogOut aria-hidden size={18} /> Sign out ({user.name})</button>
          </div>
        </div>
        <nav aria-label="Dashboard sections" className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
          {TABS.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `whitespace-nowrap border-b-4 px-4 py-3 text-lg font-bold ${isActive ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'}`}>{label}</NavLink>
          ))}
        </nav>
      </header>

      {alert && (
        <div role="alert" className="border-b-4 border-danger bg-danger px-4 py-3 text-white">
          <p className="mx-auto max-w-5xl text-lg font-bold">
            🚨 {data.elder.name} asked for help at {new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} ({TRIGGER_TEXT[alert.triggerType] || 'asked for help'}).
            Please call them now. <span className="font-normal">This app does not call or message you by itself.</span>
          </p>
        </div>
      )}

      <main id="dash" className="mx-auto max-w-5xl px-4 py-6">
        <ErrorNote>{error}</ErrorNote>
        {!data && !error && <Spinner label="Loading…" />}
        {data && <Outlet />}
      </main>
      <p className="mx-auto max-w-5xl px-4 pb-8 text-center text-base text-muted">ElderCare AI does not replace family, doctors or emergency services. You only see what {data?.elder.name || 'they'} chose to share.</p>
    </div>
  );
}

export default function CaregiverLayout() {
  return <DashboardProvider><Shell /></DashboardProvider>;
}
