import { useEffect, useState, useCallback } from 'react';

/**
 * useTheme — gestiona el tema visual de Pinca.
 *
 * Modos:
 *  - 'light'  → fuerza light, persiste en localStorage.
 *  - 'dark'   → fuerza dark, persiste en localStorage.
 *  - 'system' → sigue `prefers-color-scheme`, no persiste (limpia la key).
 *
 * El script inline en `index.html` ya aplica el tema antes de hidratar para
 * evitar flash. Este hook mantiene el DOM sincronizado con el estado React.
 */
const STORAGE_KEY = 'pinca:theme';

const getSystemTheme = () =>
  (typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches)
    ? 'dark'
    : 'light';

const readInitial = () => {
  if (typeof window === 'undefined') return { mode: 'system', resolved: 'light' };
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return { mode: stored, resolved: stored };
  }
  return { mode: 'system', resolved: getSystemTheme() };
};

export const useTheme = () => {
  const [{ mode, resolved }, setState] = useState(readInitial);

  // Aplica clase y persiste cuando cambia el estado resuelto.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, [resolved]);

  // Si el modo es 'system', escucha cambios del SO.
  useEffect(() => {
    if (mode !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setState({ mode: 'system', resolved: e.matches ? 'dark' : 'light' });
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [mode]);

  const setTheme = useCallback((next) => {
    if (next === 'system') {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      setState({ mode: 'system', resolved: getSystemTheme() });
      return;
    }
    if (next === 'light' || next === 'dark') {
      try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
      setState({ mode: next, resolved: next });
    }
  }, []);

  const toggle = useCallback(() => {
    setState((prev) => {
      const next = prev.resolved === 'dark' ? 'light' : 'dark';
      try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
      return { mode: next, resolved: next };
    });
  }, []);

  return { theme: resolved, mode, setTheme, toggle };
};

export default useTheme;
