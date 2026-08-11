// ─── Constantes ───────────────────────────────────────────────────────────────
// Roles ordenados de mayor a menor privilegio. `superadmin` y `admin` siempre
// tienen acceso total — sus toggles aparecen lockeados en la matriz.
export const ROLES = ['superadmin', 'admin', 'operador', 'visor'];
export const ROLES_LOCKEADOS = ['superadmin', 'admin'];

/**
 * Iniciales: primera letra de los 2 primeros tokens del nombre completo.
 *   "Juan Pérez"        → JP
 *   "María de la Cruz"  → MD
 *   "Juan"              → J
 *   sin nombre          → primeras 2 letras del username
 */
export const getInitials = (nombre = '', username = '') => {
  const tokens = String(nombre).trim().split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) return (tokens[0][0] + tokens[1][0]).toUpperCase();
  if (tokens.length === 1) return tokens[0][0].toUpperCase();
  return String(username).slice(0, 2).toUpperCase();
};

export const maskIp = (ip = '') => ip.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.$2.*.*');
export const fmtDate = (str) => new Date(str).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
export const decodeJwt = (tok) => { try { return JSON.parse(atob(tok.split('.')[1])); } catch { return null; } };

export const formatCountdown = (secs) => {
  if (secs <= 0) return 'Expirada';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
};

export const readPref = (key, def) => {
  const v = localStorage.getItem(key);
  return v === null ? def : v === 'true';
};
