import { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Bulk actions con selección + cambio de estado masivo. Patrón compartido por
 * FacturasTable/OrdenesTab/CotizacionesTab (antes triplicado a mano en cada
 * módulo, ver useBulkSelection.js de cada carpeta — ahora wrappers finos
 * sobre este hook).
 *
 * `changeEstadoAsync` DEBE devolver una Promise (si la mutation subyacente es
 * .mutate sin promesa, envolverla en new Promise(resolve/reject) en el
 * wrapper del módulo, no acá).
 */
export const useBulkEstadoChange = ({
  items, idKey, changeEstadoAsync, targetEstado, openConfirm,
  confirmTitle, confirmMessage, successMessage, failAllMessage,
}) => {
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
    () => items.map((r) => r[idKey]).filter(Boolean),
    [items, idKey],
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

  const runBulkChange = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkLoading(true);
    const results = await Promise.allSettled(
      ids.map((id) => changeEstadoAsync({ id, estado: targetEstado })),
    );
    const ok   = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    setBulkLoading(false);
    clearSelection();
    if (fail === 0)      toast.success(successMessage(ok));
    else if (ok === 0)   toast.error(failAllMessage(fail));
    else                 toast.success(`${ok} actualizadas, ${fail} con error`);
  }, [selectedIds, changeEstadoAsync, targetEstado, clearSelection, successMessage, failAllMessage]);

  const handleBulkChangeClick = useCallback(() => {
    if (selectedIds.size === 0) return;
    openConfirm({
      title:     confirmTitle,
      message:   confirmMessage(selectedIds.size),
      variant:   'danger',
      onConfirm: runBulkChange,
    });
  }, [selectedIds.size, openConfirm, confirmTitle, confirmMessage, runBulkChange]);

  return {
    selectedIds, bulkLoading, toggleSelected, clearSelection,
    allVisibleSelected, someVisibleSelected, toggleSelectAllVisible,
    handleBulkChangeClick,
  };
};

export default useBulkEstadoChange;
