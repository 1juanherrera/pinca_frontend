import { useBulkEstadoChange } from '../../../../hooks/useBulkEstadoChange';

// ── Selección múltiple (bulk actions) + acción bulk "Anular" ──────────────────
// PATRÓN: Bulk actions con selección + barra flotante.
// Replicado en CotizacionesTab y OrdenesTab — lógica compartida vive en
// src/hooks/useBulkEstadoChange.js; este archivo solo mapea los nombres/textos
// específicos de Facturas (idKey, estado destino, mensajes).
// Backend: cada acción se ejecuta como N requests paralelos (Promise.all).
// Para cambios de estado masivos en el futuro, considerar un endpoint
// bulk dedicado (ej: POST /facturas/bulk/cambiar-estado).
//
// Implementación clave:
//   - `selected` es Set<facturaId> en estado local del componente.
//   - Columna inicial con checkbox por fila + header checkbox que selecciona
//     todas las filas VISIBLES (página actual).
//   - Barra flotante aparece sobre TableShell cuando selected.size > 0 con
//     contador, acción primaria + "Limpiar selección".
//   - Antes de ejecutar la acción destructiva: `openConfirm` de la store
//     Zustand (variant='danger').
//   - Promise.allSettled para no abortar si una falla; toast con resultado
//     agregado.
//   - Tras ejecutar: clearSelection() + invalidación implícita via la mutation
//     onSuccess (en useFactura ya invalida facturaKeys.lists()).
export const useBulkSelection = ({ facturas, cambiarEstadoAsync, openConfirm }) => {
  const {
    selectedIds: selected, bulkLoading, toggleSelected, clearSelection,
    allVisibleSelected, someVisibleSelected, toggleSelectAllVisible,
    handleBulkChangeClick: handleBulkAnularClick,
  } = useBulkEstadoChange({
    items:             facturas,
    idKey:             'id_facturas',
    changeEstadoAsync: cambiarEstadoAsync,
    targetEstado:      'Anulada',
    openConfirm,
    confirmTitle:   'Anular facturas seleccionadas',
    confirmMessage: (n) => `¿Marcar como Anuladas ${n} factura(s)? Esta acción no se puede deshacer fácilmente.`,
    successMessage: (ok) => `${ok} factura(s) anulada(s)`,
    failAllMessage: (fail) => `No se pudo anular ninguna (${fail} con error)`,
  });

  return {
    selected, bulkLoading,
    toggleSelected, clearSelection,
    allVisibleSelected, someVisibleSelected, toggleSelectAllVisible,
    handleBulkAnularClick,
  };
};

export default useBulkSelection;
