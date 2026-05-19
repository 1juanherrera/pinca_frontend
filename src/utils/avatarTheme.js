import { useState, useEffect } from 'react';
import { useConfigValue } from '../modules/Configuracion/api/useConfiguracion';

export const ROL_STYLES = {
  admin:    { grad: 'from-violet-500 to-purple-600', badge: 'bg-violet-100 text-violet-700' },
  operador: { grad: 'from-blue-500   to-cyan-600',   badge: 'bg-blue-100   text-blue-700'   },
  visor:    { grad: 'from-zinc-500   to-zinc-600',   badge: 'bg-zinc-100   text-zinc-600'   },
};

// Fallback hardcoded — se usa si Configuración → Apariencia → avatar_palette no existe.
export const AVATAR_PALETTE_FALLBACK = [
  { key: 'default', name: 'Por rol',   grad: null,                              preview: 'from-zinc-400  to-zinc-600'    },
  { key: 'violet',  name: 'Violeta',   grad: 'from-violet-500  to-purple-600',  preview: 'from-violet-500 to-purple-600' },
  { key: 'blue',    name: 'Azul',      grad: 'from-blue-500    to-cyan-600',    preview: 'from-blue-500   to-cyan-600'   },
  { key: 'emerald', name: 'Esmeralda', grad: 'from-emerald-500 to-teal-600',    preview: 'from-emerald-500 to-teal-600'  },
  { key: 'amber',   name: 'Ámbar',     grad: 'from-amber-500   to-orange-600',  preview: 'from-amber-500  to-orange-600' },
  { key: 'rose',    name: 'Rosa',      grad: 'from-rose-500    to-pink-600',    preview: 'from-rose-500   to-pink-600'   },
  { key: 'slate',   name: 'Pizarra',   grad: 'from-slate-600   to-zinc-800',    preview: 'from-slate-600  to-zinc-800'   },
  { key: 'indigo',  name: 'Índigo',    grad: 'from-indigo-500  to-fuchsia-600', preview: 'from-indigo-500 to-fuchsia-600'},
];

/**
 * Hook: devuelve la paleta configurada en Configuración → Apariencia,
 * o el fallback hardcoded si todavía no se cargó.
 */
export const useAvatarPalette = () => useConfigValue('avatar_palette', AVATAR_PALETTE_FALLBACK);

// Back-compat: re-export AVATAR_PALETTE como FALLBACK.
// Componentes existentes que importan AVATAR_PALETTE (sync) seguirán funcionando.
export const AVATAR_PALETTE = AVATAR_PALETTE_FALLBACK;

const STORAGE_KEY = 'pinca-avatar-color';
const EVENT_NAME  = 'pinca-avatar-color-change';

export const getStoredAvatarKey = () => localStorage.getItem(STORAGE_KEY) || 'default';

export const setStoredAvatarKey = (key) => {
  localStorage.setItem(STORAGE_KEY, key);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: key }));
};

export const useAvatarKey = () => {
  const [key, setKey] = useState(() => getStoredAvatarKey());
  useEffect(() => {
    const onChange = (e) => setKey(e.detail);
    window.addEventListener(EVENT_NAME, onChange);
    return () => window.removeEventListener(EVENT_NAME, onChange);
  }, []);
  return key;
};

export const useAvatarGradient = (rol) => {
  const key     = useAvatarKey();
  const palette = useAvatarPalette() ?? AVATAR_PALETTE_FALLBACK;
  const found   = (Array.isArray(palette) ? palette : AVATAR_PALETTE_FALLBACK).find(p => p.key === key);
  if (found && found.grad) return found.grad;
  return ROL_STYLES[rol]?.grad ?? ROL_STYLES.visor.grad;
};
