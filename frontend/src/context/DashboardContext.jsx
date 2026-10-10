import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';

export const DashboardContext = createContext(null);
export const useDashboard = () => useContext(DashboardContext);

// Loads the caregiver's linked seniors and the (already privacy-filtered) dashboard. Refreshes every 30 s.
export function DashboardProvider({ children }) {
  const [elders, setElders] = useState(null);
  const [elderId, setElderId] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    api.get('/caregiver/elders')
      .then((d) => {
        setElders(d.elders);
        if (d.elders[0]) setElderId(d.elders[0].id);
        else setError('No one has added you as a family contact yet. Ask them to add your email address under "Family & trusted contacts".');
      })
      .catch((e) => { setElders([]); setError(e.message); });
  }, []);

  const load = useCallback(() => {
    if (!elderId) return Promise.resolve();
    return api.get(`/caregiver/dashboard?elderId=${elderId}`)
      .then((d) => { setData(d); setUpdatedAt(new Date()); setError(''); })
      .catch((e) => setError(e.message));
  }, [elderId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const select = useCallback((id) => { setData(null); setElderId(id); }, []);
  const value = useMemo(() => ({ elders, elderId, select, data, error, updatedAt, refresh: load }), [elders, elderId, select, data, error, updatedAt, load]);
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}
