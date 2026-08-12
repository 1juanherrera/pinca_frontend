import { fmt } from '../../../utils/formatters';

export const fmtNum = (v, dec = 0) =>
  Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec });

export const fmtCOPCompact = (v) => {
  const n = Number(v ?? 0);
  if (n === 0) return '$0';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return fmt(n);
};

export const fmtPct = (v) => `${Number(v ?? 0).toFixed(1)}%`;
