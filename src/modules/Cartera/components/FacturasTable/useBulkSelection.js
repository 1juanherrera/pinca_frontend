import { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

// ── Selección múltiple (bulk actions) + acción bulk "Anular" ──────────────────
// PATRÓN: Bulk actions con selección + barra flotante.
// Replicar en CotizacionesTab y OrdenesTab cuando se decida.
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
  const [selected, setSelected] = useState(() => new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const toggleSelected = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  // Select-all SOBRE las filas visibles (página actual del server).
  const visibleIds = useMemo(
    () => facturas.map((r) => r.id_facturas).filter(Boolean),
    [facturas],
  );
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));
  const someVisibleSelected = visibleIds.some((id) => selected.has(id));

  const toggleSelectAllVisible = useCallback(() => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [allVisibleSelected, visibleIds]);

  const runBulkAnular = useCallback(async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkLoading(true);
    const results = await Promise.allSettled(
      ids.map((id) => cambiarEstadoAsync({ id, estado: 'Anulada' })),
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    setBulkLoading(false);
    clearSelection();
    if (fail === 0) {
      toast.success(`${ok} factura(s) anulada(s)`);
    } else if (ok === 0) {
      toast.error(`No se pudo anular ninguna (${fail} con error)`);
    } else {
      toast.success(`${ok} actualizadas, ${fail} con error`);
    }
  }, [selected, cambiarEstadoAsync, clearSelection]);

  const handleBulkAnularClick = useCallback(() => {
    if (selected.size === 0) return;
    openConfirm({
      title: 'Anular facturas seleccionadas',
      message: `¿Marcar como Anuladas ${selected.size} factura(s)? Esta acción no se puede deshacer fácilmente.`,
      variant: 'danger',
      onConfirm: runBulkAnular,
    });
  }, [selected.size, openConfirm, runBulkAnular]);

  return {
    selected, bulkLoading,
    toggleSelected, clearSelection,
    allVisibleSelected, someVisibleSelected, toggleSelectAllVisible,
    handleBulkAnularClick,
  };
};

export default useBulkSelection;
