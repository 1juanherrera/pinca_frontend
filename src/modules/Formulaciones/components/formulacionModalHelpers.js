// ─── Helpers compartidos entre FormulacionModal e IngredientCard ─────────────
export const fmtCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0);

export const fmtKg = (v, dec = 2) =>
  Number.isFinite(Number(v)) ? Number(v).toFixed(dec) : '—';
