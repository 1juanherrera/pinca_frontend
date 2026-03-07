export const formatNumber = (val) => {
  if (!val) return "0.00";
  return new Intl.NumberFormat('de-DE').format(parseFloat(String(val).replace(/\./g, '').replace(',', '.')));
};

export const parseCOP = (val) => {
  if (!val && val !== 0) return 0;
  if (typeof val === 'number') return val;
  return parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || 0;
};

export const formatCOP = (n) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
  }).format(n);