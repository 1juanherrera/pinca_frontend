import { useState, useMemo } from 'react';

/**
 * useTableSort
 * Encapsula la lógica de ordenamiento para ERPTable.
 *
 * @param {Array}  data     – arreglo ya filtrado que se va a ordenar
 * @returns {{ sorted, sortBy, sortDir, handleSort }}
 *
 * Uso:
 *   const { sorted, sortBy, sortDir, handleSort } = useTableSort(filtered);
 *
 *   <ERPTable
 *     data={sorted}
 *     sortBy={sortBy}
 *     sortDir={sortDir}
 *     onSort={handleSort}
 *   />
 */
const useTableSort = (data = []) => {
  const [sortBy,  setSortBy]  = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    if (!sortBy) return data;
    return [...data].sort((a, b) => {
      const av = a[sortBy] ?? '';
      const bv = b[sortBy] ?? '';
      const cmp = String(av).localeCompare(String(bv), 'es', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortBy, sortDir]);

  return { sorted, sortBy, sortDir, handleSort };
};

export default useTableSort;