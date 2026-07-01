import { es } from 'date-fns/locale';
import { format, parseISO, isValid } from 'date-fns';

const isoToDate = (iso) => {
  if (!iso) return undefined;
  const d = parseISO(iso);
  return isValid(d) ? d : undefined;
};

/**
 * Formatea una fecha (ISO string o Date) a un chip corto y legible:
 *   "5 May 2026". Mes capitalizado.
 *
 * Extraído de DateRangePicker.jsx para que ese archivo solo exporte componentes
 * (regla react-refresh/only-export-components).
 */
export const fmtFechaChip = (d) => {
  if (!d) return null;
  const date = typeof d === 'string' ? isoToDate(d) : d;
  if (!date) return null;
  const s = format(date, 'd MMM yyyy', { locale: es });
  // Capitalizar el mes (date-fns devuelve en minúsculas)
  return s.replace(/\s([a-z])/, (_, c) => ' ' + c.toUpperCase());
};

export default fmtFechaChip;
