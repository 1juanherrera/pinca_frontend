import { useCallback } from 'react';
import { useBulkEstadoChange } from '../../../../hooks/useBulkEstadoChange';

// ─── Selección múltiple (bulk actions) ──────────────────────────────────
// Lógica compartida vive en src/hooks/useBulkEstadoChange.js; este archivo
// solo mapea los nombres/textos específicos de Cotizaciones, y envuelve
// `cambiarEstado` (.mutate, sin promesa) en una función que sí devuelve
// Promise — el hook genérico espera changeEstadoAsync() => Promise.
export const useBulkSelection = ({ cotizaciones, cambiarEstado, openConfirm }) => {
  const cambiarEstadoAsync = useCallback((payload) => new Promise((resolve, reject) =>
    cambiarEstado(payload, { onSuccess: resolve, onError: reject }),
  ), [cambiarEstado]);

  const { handleBulkChangeClick: handleBulkRechazarClick, ...rest } = useBulkEstadoChange({
    items:             cotizaciones,
    idKey:             'id_cotizaciones',
    changeEstadoAsync: cambiarEstadoAsync,
    targetEstado:      'Rechazada',
    openConfirm,
    confirmTitle:   'Rechazar cotizaciones seleccionadas',
    confirmMessage: (n) => `¿Marcar como Rechazadas ${n} cotización(es)?`,
    successMessage: (ok) => `${ok} cotización(es) rechazada(s)`,
    failAllMessage: (fail) => `No se pudo rechazar ninguna (${fail} con error)`,
  });

  return { ...rest, handleBulkRechazarClick };
};

export default useBulkSelection;
