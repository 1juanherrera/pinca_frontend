export const formatoPesoColombiano = (valor) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(valor);
}

export const formatoMonedaLocal = (valor) => {
    const numero = parseFloat(valor);
    if (isNaN(numero)) return "";
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0, // En COP no solemos usar decimales, pero puedes poner 2 si prefieres
    }).format(numero);
};

// Parse a Colombian formatted currency string like "$ 48.000,00" into a number (48000)
export const parsePesoColombiano = (valor) => {
  if (valor == null) return 0;
  if (typeof valor === 'number') return valor;
  let s = String(valor).trim();
  // Remove any non digit, dot or comma characters (currency symbol, spaces)
  s = s.replace(/[^0-9.,-]/g, '');
  if (!s) return 0;
  // If string uses '.' as thousand separator and ',' as decimal (e.g. 48.000,00)
  // remove dots and replace comma with dot -> 48000.00
  const normalized = s.replace(/\./g, '').replace(/,/g, '.');
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

// Generate a stable item id for items that may not have a numeric id.
// Priority: id_proveedor -> id -> codigo -> nombre+unidad (fallback).
export const stableItemId = (item = {}, providerPrefix = '') => {
  if (!item) return String(providerPrefix || '') + '-unknown';
  if (item.id_proveedor != null && item.id_proveedor !== '') return String(item.id_proveedor);
  if (item.id != null && item.id !== '') return String(item.id);
  if (item.codigo) return String(item.codigo);
  // fallback: use a deterministic combination of name + providerPrefix
  const name = (item.nombre || 'item').toString().replace(/\s+/g, '_');
  return `${providerPrefix ? providerPrefix + '-' : ''}${name}`;
}

export const validarEntero = (valor) => {
  // Intenta convertir a número
  const numero = Number(valor);

  // Verifica si es realmente un número
  if (isNaN(numero)) return valor; // Si no es número, lo deja como está

  // Si es número entero, lo retorna como entero
  if (Number.isInteger(numero)) {
    return parseInt(numero);
  }

  // Si es decimal, lo deja igual
  return valor;
}

export const fmt = (v) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(Number(v) || 0);

/**
 * Formatea una fecha de DB (YYYY-MM-DD) a formato: "Mar 11 2026"
*/
export const formatLetterDate = (dateString) => {
  if (!dateString) return "—";

  const date = new Date(`${dateString}T00:00:00`);
  
  const options = { month: 'short', day: '2-digit', year: 'numeric' };
  let formatted = date.toLocaleDateString('es-ES', options);

  // Corregido: quitamos el escape innecesario del punto
  formatted = formatted.replace(/[.,]/g, ""); 
  
  // Para que el formato sea "Mes Día Año" exacto como pediste
  // Reordenamos las partes: [día, mes, año] -> [mes, día, año]
  const partes = formatted.split(" ");
  const mesCapitalizado = partes[1].charAt(0).toUpperCase() + partes[1].slice(1);
  
  return `${mesCapitalizado} ${partes[0]} ${partes[2]}`;
};