import { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

// ─── Selección múltiple (bulk actions) — patrón de FacturasTable ─────────
export const useBulkSelection = ({ ordenes, cambiarEstadoAsync, openConfirm }) => {
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const toggleSelected = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // Select-all sobre las filas visibles (página actual del server).
  const visibleIds = useMemo(
    () => ordenes.map((r) => r.id_orden).filter(Boolean),
    [ordenes],
  );
  const allVisibleSelected  = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else                    visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }, [allVisibleSelected, visibleIds]);

  // ─── Bulk action: cambiar estado a Cancelada ────────────────────────────
  const runBulkCancelar = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkLoading(true);
    const results = await Promise.allSettled(
      ids.map((id) => cambiarEstadoAsync({ id, estado: 'Cancelada' })),
    );
    const ok   = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    setBulkLoading(false);
    clearSelection();
    if (fail === 0)      toast.success(`${ok} orden(es) cancelada(s)`);
    else if (ok === 0)   toast.error(`No se pudo cancelar ninguna (${fail} con error)`);
    else                 toast.success(`${ok} actualizadas, ${fail} con error`);
  }, [selectedIds, cambiarEstadoAsync, clearSelection]);

  const handleBulkCancelarClick = useCallback(() => {
    if (selectedIds.size === 0) return;
    openConfirm({
      title:   'Cancelar órdenes seleccionadas',
      message: `¿Marcar como Canceladas ${selectedIds.size} orden(es)?`,
      variant: 'danger',
      onConfirm: runBulkCancelar,
    });
  }, [selectedIds.size, openConfirm, runBulkCancelar]);

  return {
    selectedIds, bulkLoading, toggleSelected, clearSelection,
    allVisibleSelected, someVisibleSelected, toggleSelectAllVisible,
    handleBulkCancelarClick,
  };
};

export default useBulkSelection;
