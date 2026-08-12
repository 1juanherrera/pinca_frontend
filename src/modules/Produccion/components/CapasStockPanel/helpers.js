export const fmtNum = (v) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(Number(v) || 0);

export const fmtCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0);

export const fmtFecha = (f) => {
  if (!f) return '—';
  const d = new Date(f);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' });
};
