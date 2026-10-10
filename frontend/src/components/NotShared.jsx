import { Lock } from 'lucide-react';

// Shown instead of data the senior has chosen NOT to share. Makes privacy visible.
export default function NotShared({ name, what }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-line p-4 text-muted">
      <Lock aria-hidden size={22} className="shrink-0" />
      <p className="text-base"><b>{name}</b> has not shared {what} with you.</p>
    </div>
  );
}
