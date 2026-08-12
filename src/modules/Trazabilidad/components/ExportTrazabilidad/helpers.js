export const fmtNum = (v, dec = 2) =>
  Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec });

export const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d.split(' ')[0] ?? d.split('T')[0]).toLocaleDateString('es-CO'); } catch { return d; }
};
