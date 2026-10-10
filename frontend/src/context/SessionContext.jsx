import { createContext, useContext, useMemo, useState } from 'react';

const SessionContext = createContext(null);
export const useSession = () => useContext(SessionContext);

// Remembers what the person was just looking at (e.g. "Pay electricity bill") so that a
// voice command like "remind me tomorrow morning" knows what it is about.
export function SessionProvider({ children }) {
  const [topic, setTopic] = useState('');
  const value = useMemo(() => ({ topic, setTopic }), [topic]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
