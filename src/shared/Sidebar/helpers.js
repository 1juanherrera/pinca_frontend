import { Boxes, Landmark, Package, ShoppingCart, Store } from 'lucide-react';

export const PINNED_KEY    = 'sidebar_pinned';
export const COLLAPSED_KEY = 'sidebar_collapsed_groups';

// Icono representativo por grupo (cuando el sidebar está plegado).
// Se eligen iconos diferentes a los de los items individuales para evitar confusión.
export const GROUP_ICONS = {
  'Inventario': Package,
  'Producción': Boxes,
  'Ventas':     ShoppingCart,
  'Compras':    Store,
  'Finanzas':   Landmark,
};

export const loadJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};
export const saveJson = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ }
};
