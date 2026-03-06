export const formatNumber = (val) => {
  if (!val) return "0.00";
  return new Intl.NumberFormat('de-DE').format(parseFloat(String(val).replace(/\./g, '').replace(',', '.')));
};