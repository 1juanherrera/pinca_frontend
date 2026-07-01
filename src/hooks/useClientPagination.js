/**
 * useClientPagination — hook auxiliar para paginar client-side.
 *
 * Resetea automáticamente la página al cambiar el tamaño del dataset o perPage.
 *
 * Uso:
 *   const pag = useClientPagination(filtered, 20);
 *   <ErpTable data={pag.paginated} ... />
 *   <TableShell pagination={pag}>...</TableShell>
 */
import { useMemo, useState } from 'react';

const useClientPagination = (data = [], defaultPerPage = 20) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage]         = useState(defaultPerPage);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  // Reset al cambiar tamaño del set (por filtros) o perPage — derivado en
  // render usando "snapshot" en useState. Evita el setState-in-effect que
  // causa cascading renders. Patrón documentado en React docs:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [lastResetKey, setLastResetKey] = useState(`${totalItems}|${perPage}`);
  const currentResetKey = `${totalItems}|${perPage}`;
  if (lastResetKey !== currentResetKey) {
    setLastResetKey(currentResetKey);
    setCurrentPage(1);
  }

  const safePage  = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return data.slice(start, start + perPage);
  }, [data, safePage, perPage]);

  return {
    paginated,
    currentPage: safePage,
    perPage,
    totalItems,
    totalPages,
    setCurrentPage,
    setPerPage,
  };
};

export default useClientPagination;
