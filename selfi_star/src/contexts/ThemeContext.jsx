import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─── Preset Themes ─────────────────────────────────────────────────────────────
export const PRESET_THEMES = {
  flipstar: {
    name: 'Flipstar Gold', emoji: '⭐', category: 'Brand',
    light: { pri: '#DA9B2A', txt: '#1C1917', sub: '#78716C', bg: '#FAFAF7', dark: '#0C1A12', border: '#E7E5E4', cardBg: '#fff' },
    dark:  { pri: '#F0B93A', txt: '#FAFAF7', sub: '#A8A29E', bg: '#1C1917', dark: '#0C1A12', border: '#292524', cardBg: '#292524' },
  },
  ocean: {
    name: 'Ocean Blue', emoji: '🌊', category: 'Color',
    light: { pri: '#0EA5E9', txt: '#0C1A2E', sub: '#64748B', bg: '#F0F9FF', dark: '#0C1A2E', border: '#BAE6FD', cardBg: '#fff' },
    dark:  { pri: '#38BDF8', txt: '#F0F9FF', sub: '#94A3B8', bg: '#0F172A', dark: '#020617', border: '#1E293B', cardBg: '#1E293B' },
  },
  forest: {
    name: 'Forest Green', emoji: '🌿', category: 'Color',
    light: { pri: '#16A34A', txt: '#14532D', sub: '#6B7280', bg: '#F0FDF4', dark: '#052E16', border: '#BBF7D0', cardBg: '#fff' },
    dark:  { pri: '#4ADE80', txt: '#F0FDF4', sub: '#9CA3AF', bg: '#052E16', dark: '#011E0A', border: '#14532D', cardBg: '#0F3D1E' },
  },
  sunset: {
    name: 'Sunset Orange', emoji: '🌅', category: 'Color',
    light: { pri: '#EA580C', txt: '#1C0A00', sub: '#78716C', bg: '#FFF7ED', dark: '#1C0A00', border: '#FDBA74', cardBg: '#fff' },
    dark:  { pri: '#FB923C', txt: '#FFF7ED', sub: '#A8A29E', bg: '#1C0A00', dark: '#0C0500', border: '#431407', cardBg: '#2D1408' },
  },
  royal: {
    name: 'Royal Purple', emoji: '👑', category: 'Color',
    light: { pri: '#7C3AED', txt: '#1E1B4B', sub: '#6B7280', bg: '#FAF5FF', dark: '#1E1B4B', border: '#DDD6FE', cardBg: '#fff' },
    dark:  { pri: '#A78BFA', txt: '#FAF5FF', sub: '#9CA3AF', bg: '#1E1B4B', dark: '#0D0B2E', border: '#312E81', cardBg: '#2D2466' },
  },
  rose: {
    name: 'Rose Gold', emoji: '🌸', category: 'Color',
    light: { pri: '#E11D48', txt: '#1C0A12', sub: '#78716C', bg: '#FFF1F2', dark: '#1C0A12', border: '#FECDD3', cardBg: '#fff' },
    dark:  { pri: '#FB7185', txt: '#FFF1F2', sub: '#A8A29E', bg: '#1C0A12', dark: '#0C0508', border: '#4C0519', cardBg: '#2D1020' },
  },
  midnight: {
    name: 'Midnight', emoji: '🌙', category: 'Dark',
    light: { pri: '#6366F1', txt: '#111827', sub: '#6B7280', bg: '#F9FAFB', dark: '#111827', border: '#E5E7EB', cardBg: '#fff' },
    dark:  { pri: '#818CF8', txt: '#F9FAFB', sub: '#9CA3AF', bg: '#0F0F1A', dark: '#07070D', border: '#1F2937', cardBg: '#161626' },
  },
  minimal: {
    name: 'Minimal', emoji: '⚪', category: 'Minimal',
    light: { pri: '#374151', txt: '#111827', sub: '#6B7280', bg: '#F9FAFB', dark: '#111827', border: '#E5E7EB', cardBg: '#fff' },
    dark:  { pri: '#9CA3AF', txt: '#F9FAFB', sub: '#6B7280', bg: '#111827', dark: '#030712', border: '#1F2937', cardBg: '#1F2937' },
  },
  teal: {
    name: 'Teal Breeze', emoji: '💎', category: 'Color',
    light: { pri: '#0D9488', txt: '#134E4A', sub: '#6B7280', bg: '#F0FDFA', dark: '#042F2E', border: '#99F6E4', cardBg: '#fff' },
    dark:  { pri: '#2DD4BF', txt: '#F0FDFA', sub: '#9CA3AF', bg: '#042F2E', dark: '#011C1B', border: '#115E59', cardBg: '#0D3D3B' },
  },
  crimson: {
    name: 'Crimson', emoji: '🔴', category: 'Dark',
    light: { pri: '#DC2626', txt: '#1C1917', sub: '#78716C', bg: '#FFF5F5', dark: '#450A0A', border: '#FECACA', cardBg: '#fff' },
    dark:  { pri: '#F87171', txt: '#FEF2F2', sub: '#A8A29E', bg: '#1C0A0A', dark: '#0A0000', border: '#450A0A', cardBg: '#2D1010' },
  },
};

const STORAGE_KEY = '_platform_theme';

function loadStored() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function applyCSS(colors) {
  const r = document.documentElement;
  r.style.setProperty('--color-primary', colors.pri);
  r.style.setProperty('--color-bg', colors.bg);
  r.style.setProperty('--color-txt', colors.txt);
  r.style.setProperty('--color-sub', colors.sub);
  r.style.setProperty('--color-border', colors.border);
  r.style.setProperty('--color-card', colors.cardBg);
  document.body.style.background = colors.bg;
  document.body.style.color = colors.txt;
}

// ─── Context ───────────────────────────────────────────────────────────────────
const ThemeContext = createContext();

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export const ThemeProvider = ({ children }) => {
  const stored = loadStored();
  const [preset, setPreset] = useState(stored.preset || 'flipstar');
  const [darkMode, setDarkMode] = useState(stored.darkMode ?? false);
  const [customPrimary, setCustomPrimary] = useState(stored.customPrimary || null);

  const resolveColors = useCallback((p = preset, dm = darkMode, cp = customPrimary) => {
    const base = PRESET_THEMES[p] || PRESET_THEMES.flipstar;
    const c = { ...(dm ? base.dark : base.light) };
    if (cp) c.pri = cp;
    return c;
  }, [preset, darkMode, customPrimary]);

  const colors = resolveColors();

  const persist = (p, dm, cp) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ preset: p, darkMode: dm, customPrimary: cp }));
  };

  useEffect(() => {
    applyCSS(resolveColors());
  }, [preset, darkMode, customPrimary]);

  // Listen for storage events from admin panel saves (same-tab via dispatchEvent + cross-tab native)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const d = JSON.parse(e.newValue || '{}');
        if (d.preset !== undefined) setPreset(d.preset || 'flipstar');
        setDarkMode(d.darkMode ?? false);
        setCustomPrimary(d.customPrimary || null);
      } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setThemePreset = useCallback((newPreset) => {
    setPreset(newPreset);
    setCustomPrimary(null);
    persist(newPreset, darkMode, null);
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    const nd = !darkMode;
    setDarkMode(nd);
    persist(preset, nd, customPrimary);
  }, [darkMode, preset, customPrimary]);

  const setCustomColor = useCallback((color) => {
    setCustomPrimary(color || null);
    persist(preset, darkMode, color || null);
  }, [preset, darkMode]);

  const applyFromSettings = useCallback((settings) => {
    if (!settings) return;
    const p = settings.theme_preset || preset;
    const dm = settings.dark_mode_default ?? darkMode;
    const cp = settings.primary_color_override || null;
    setPreset(p);
    setDarkMode(dm);
    setCustomPrimary(cp);
    persist(p, dm, cp);
  }, [preset, darkMode]);

  return (
    <ThemeContext.Provider value={{
      colors,
      darkMode,
      preset,
      toggleDarkMode,
      setThemePreset,
      setCustomColor,
      applyFromSettings,
      resolveColors,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
