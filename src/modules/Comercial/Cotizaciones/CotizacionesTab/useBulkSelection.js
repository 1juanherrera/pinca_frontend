import { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

// ─── Selección múltiple (bulk actions) ──────────────────────────────────
export const useBulkSelection = ({ cotizaciones, cambiarEstado, openConfirm }) => {
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
    () => cotizaciones.map((r) => r.id_cotizaciones).filter(Boolean),
    [cotizaciones],
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

  // ─── Bulk action: cambiar estado a Rechazada ────────────────────────────
  // cambiarEstado es .mutate (no devuelve promesa); lo envolvemos con sus
  // callbacks per-call para poder usar Promise.allSettled sin tocar el hook.
  const runBulkRechazar = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkLoading(true);
    const results = await Promise.allSettled(
      ids.map((id) => new Promise((resolve, reject) =>
        cambiarEstado({ id, estado: 'Rechazada' }, { onSuccess: resolve, onError: reject }),
      )),
    );
    const ok   = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    setBulkLoading(false);
    clearSelection();
    if (fail === 0)      toast.success(`${ok} cotización(es) rechazada(s)`);
    else if (ok === 0)   toast.error(`No se pudo rechazar ninguna (${fail} con error)`);
    else                 toast.success(`${ok} actualizadas, ${fail} con error`);
  }, [selectedIds, cambiarEstado, clearSelection]);

  const handleBulkRechazarClick = useCallback(() => {
    if (selectedIds.size === 0) return;
    openConfirm({
      title:   'Rechazar cotizaciones seleccionadas',
      message: `¿Marcar como Rechazadas ${selectedIds.size} cotización(es)?`,
      variant: 'danger',
      onConfirm: runBulkRechazar,
    });
  }, [selectedIds.size, openConfirm, runBulkRechazar]);

  return {
    selectedIds, bulkLoading, toggleSelected, clearSelection,
    allVisibleSelected, someVisibleSelected, toggleSelectAllVisible,
    handleBulkRechazarClick,
  };
};

export default useBulkSelection;
