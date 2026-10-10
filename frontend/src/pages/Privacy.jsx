import { PageHeader } from '../components/ui.jsx';
import PrivacyControls from '../components/PrivacyControls.jsx';

export default function Privacy() {
  return (
    <div>
      <PageHeader title="Privacy" back="/settings" subtitle="You decide what your family can see." />
      <PrivacyControls />
    </div>
  );
}
