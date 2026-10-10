import { Navigate, Route, Routes } from 'react-router-dom';
import RequireRole from './components/RequireRole.jsx';
import ElderLayout from './layouts/ElderLayout.jsx';
import CaregiverLayout from './layouts/CaregiverLayout.jsx';
import Login from './pages/Login.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Home from './pages/Home.jsx';
import Understand from './pages/Understand.jsx';
import Explain from './pages/Explain.jsx';
import Reminders from './pages/Reminders.jsx';
import Emergency from './pages/Emergency.jsx';
import Contacts from './pages/Contacts.jsx';
import Settings from './pages/Settings.jsx';
import Privacy from './pages/Privacy.jsx';
import FamilyOverview from './pages/family/Overview.jsx';
import FamilyReminders from './pages/family/Reminders.jsx';
import FamilyEmergency from './pages/family/Emergency.jsx';
import FamilyPrivacy from './pages/family/Privacy.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Seniors */}
      <Route element={<RequireRole role="elder" />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<ElderLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/understand" element={<Understand />} />
          <Route path="/explain" element={<Explain />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/privacy" element={<Privacy />} />
        </Route>
      </Route>

      {/* Family / caregivers */}
      <Route element={<RequireRole role="caregiver" />}>
        <Route element={<CaregiverLayout />}>
          <Route path="/family" element={<FamilyOverview />} />
          <Route path="/family/reminders" element={<FamilyReminders />} />
          <Route path="/family/emergency" element={<FamilyEmergency />} />
          <Route path="/family/privacy" element={<FamilyPrivacy />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
