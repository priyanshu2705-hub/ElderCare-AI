import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const SettingsContext = createContext(null);
export const useSettings = () => useContext(SettingsContext);

const DEFAULTS = { textSize: 'large', highContrast: false, voiceSpeed: 0.9, voiceEnabled: true, language: 'en-IN', interactionMode: 'voice', onboardingDone: true };
const FONT_PX = { large: 20, xlarge: 24, xxlarge: 28 };

// Accessibility settings are stored on the elder's profile and applied to the whole page.
export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (user?.role !== 'elder') { setSettings(DEFAULTS); setReady(true); return; }
    setReady(false);
    api.get('/profile')
      .then(({ profile }) => setSettings({
        ...DEFAULTS, ...profile.accessibility,
        language: profile.preferences?.language || DEFAULTS.language,
        interactionMode: profile.preferences?.interactionMode || DEFAULTS.interactionMode,
        onboardingDone: profile.onboardingDone,
      }))
      .catch(() => {}) // keep defaults if the profile cannot be loaded
      .finally(() => setReady(true));
  }, [user]);

  // Apply to <html>: text size + contrast. Caregivers get normal-size text.
  useEffect(() => {
    const px = user?.role === 'elder' ? FONT_PX[settings.textSize] || 20 : 16;
    document.documentElement.style.fontSize = `${px}px`;
    document.documentElement.dataset.contrast = settings.highContrast ? 'high' : 'normal';
  }, [settings.textSize, settings.highContrast, user]);

  const update = useCallback(async (patch) => {
    setSettings((s) => ({ ...s, ...patch })); // instant feedback
    const body = {};
    const acc = ['textSize', 'highContrast', 'voiceSpeed', 'voiceEnabled'].filter((k) => k in patch);
    if (acc.length) body.accessibility = Object.fromEntries(acc.map((k) => [k, patch[k]]));
    if ('language' in patch || 'interactionMode' in patch) {
      body.preferences = {};
      if ('language' in patch) body.preferences.language = patch.language;
      if ('interactionMode' in patch) body.preferences.interactionMode = patch.interactionMode;
    }
    if ('onboardingDone' in patch) body.onboardingDone = patch.onboardingDone;
    await api.put('/profile', body);
  }, []);

  const value = useMemo(() => ({ settings, update, ready }), [settings, update, ready]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
