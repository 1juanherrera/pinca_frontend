import { useState, useMemo, useCallback } from 'react';
import { Factory, RefreshCw } from 'lucide-react';
import { usePreparaciones } from '../Formulaciones/api/usePreparaciones';
import { ProduccionKPIs } from './components/ProduccionKPIs';
import { ProduccionFilters } from './components/ProduccionFilters ';
import { ProduccionDetailModal } from './components/ProduccionDetailModal';
import { ProduccionTable } from './components/ProduccionTable ';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const applyFilters = (data, filters) => {
  if (!Array.isArray(data)) return [];
  let result = [...data];

  if (filters.estado && filters.estado !== 'TODOS') {
    result = result.filter(r => r.estado === filters.estado);
  }

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(r =>
      r.item_nombre?.toLowerCase().includes(q) ||
      r.item_codigo?.toLowerCase().includes(q)
    );
  }

  if (filters.item) {
    result = result.filter(r => String(r.item_general_id) === filters.item);
  }

  if (filters.desde) {
    const desde = new Date(filters.desde);
    result = result.filter(r => r.fecha_creacion && new Date(r.fecha_creacion) >= desde);
  }

  if (filters.hasta) {
    const hasta = new Date(filters.hasta);
    hasta.setHours(23, 59, 59);
    result = result.filter(r => r.fecha_creacion && new Date(r.fecha_creacion) <= hasta);
  }

  return result;
};

const applySorting = (data, sortBy, sortDir) => {
  if (!Array.isArray(data)) return [];
  return [...data].sort((a, b) => {
    const av = a[sortBy] ?? '';
    const bv = b[sortBy] ?? '';
    const cmp = typeof av === 'number'
      ? av - bv
      : String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });
};

// ─── Página ───────────────────────────────────────────────────────────────────
const ProduccionPage = () => {
  // ── Estado de UI ─────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    estado: 'TODOS',
    search: '',
    item:   '',
    desde:  '',
    hasta:  '',
  });
  const [sortBy,          setSortBy]          = useState('id_preparaciones');
  const [sortDir,         setSortDir]         = useState('desc');
  const [selectedRow,     setSelectedRow]     = useState(null);

  // ── Datos ─────────────────────────────────────────────────────────────────
  // fetchList: true → activa la query GET /preparaciones (lista global)
  const { preparacionesByItem: allPreparaciones, isLoadingByItem, refresh } =
    usePreparaciones(null, null, { fetchList: true });

  // ── Procesado ─────────────────────────────────────────────────────────────
  const filtered = useMemo(
    () => applyFilters(allPreparaciones, filters),
    [allPreparaciones, filters]
  );

  const sorted = useMemo(
    () => applySorting(filtered, sortBy, sortDir),
    [filtered, sortBy, sortDir]
  );

  console.log(allPreparaciones)

  // Opciones únicas de item para el select de filtros
  const itemOptions = useMemo(() => {
    const map = new Map();
    allPreparaciones.forEach(p => {
      if (!map.has(p.item_general_id)) {
        map.set(p.item_general_id, { value: String(p.item_general_id), label: p.item_nombre });
      }
    });
    return Array.from(map.values());
  }, [allPreparaciones]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSort = useCallback((field) => {
    setSortBy(prev => {
      if (prev === field) {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortDir('asc');
      return field;
    });
  }, []);

  const handleRowClick = useCallback((row) => {
    setSelectedRow(row);
  }, []);

  const handleUpdated = useCallback((updatedPreparacion) => {
    // Actualiza la fila seleccionada en el modal con el nuevo estado
    setSelectedRow(updatedPreparacion);
    // La caché ya la actualiza el hook vía optimistic update
    refresh();
  }, [refresh]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col w-full gap-2">

      {/* ── KPIs ── */}
      <ProduccionKPIs data={allPreparaciones} />

      {/* ── Filtros ── */}
      <div className="bg-white border border-zinc-100 rounded-2xl px-5 py-4 shadow-sm">
        <ProduccionFilters
          filters={filters}
          onChange={setFilters}
          itemOptions={itemOptions}
        />
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white border border-zinc-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Sub-header de tabla */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
          <p className="text-xs font-bold text-zinc-500">
            {isLoadingByItem
              ? 'Cargando órdenes…'
              : `${sorted.length} ${sorted.length === 1 ? 'orden' : 'órdenes'} encontradas`}
          </p>
          {filters.estado !== 'TODOS' && (
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Filtrado por: {filters.estado.replace('_', ' ')}
            </span>
          )}
        </div>

        <ProduccionTable
          data={sorted}
          isLoading={isLoadingByItem}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          onRowClick={handleRowClick}
        />
      </div>

      {/* ── Modal de detalle ── */}
      {selectedRow && (
        <ProduccionDetailModal
          preparacion={selectedRow}
          onClose={() => setSelectedRow(null)}
          onUpdated={handleUpdated}
        />
      )}

    </div>
  );
};

export default ProduccionPage;