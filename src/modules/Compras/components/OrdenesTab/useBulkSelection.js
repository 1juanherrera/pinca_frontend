import { useBulkEstadoChange } from '../../../../hooks/useBulkEstadoChange';

// ─── Selección múltiple (bulk actions) — patrón de FacturasTable ─────────
// Lógica compartida vive en src/hooks/useBulkEstadoChange.js; este archivo
// solo mapea los nombres/textos específicos de Órdenes de Compra.
export const useBulkSelection = ({ ordenes, cambiarEstadoAsync, openConfirm }) => {
  const { handleBulkChangeClick: handleBulkCancelarClick, ...rest } = useBulkEstadoChange({
    items:             ordenes,
    idKey:             'id_orden',
    changeEstadoAsync: cambiarEstadoAsync,
    targetEstado:      'Cancelada',
    openConfirm,
    confirmTitle:   'Cancelar órdenes seleccionadas',
    confirmMessage: (n) => `¿Marcar como Canceladas ${n} orden(es)?`,
    successMessage: (ok) => `${ok} orden(es) cancelada(s)`,
    failAllMessage: (fail) => `No se pudo cancelar ninguna (${fail} con error)`,
  });
  return { ...rest, handleBulkCancelarClick };
};

export default useBulkSelection;
