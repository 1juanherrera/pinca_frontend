import {
  Trash2,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Wrench,
} from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import { NavTabs } from './NavTabs';
import { formatoPesoColombiano } from '../../../utils/formatters';
import { useState, useMemo } from 'react';
import usePageSize from '../../../hooks/usePageSize';
import { useInventario } from '../api/useInventario';
import ConfirmModal from '../../../shared/ConfirmModal';
import StatusBadge from '../../../shared/StatusBadge';
import ErpTable from '../../../shared/ErpTable';
import { getPaginationRange } from '../services/pagination';
import { ExcelModal } from './ExcelModal';
import { TraspasoModal } from './TraspasoModal';
import AjusteModal from './AjusteModal';
import { useBodegas } from '../../Bodegas/api/useBodegas';
import cn from '../../../utils/cn';

const getTipoLabel = (tipo) => {
  if (String(tipo).includes('MATERIA') || tipo === '1') return 'MATERIA PRIMA';
  if (String(tipo).includes('INSUMO')  || tipo === '2') return 'INSUMO';
  return 'PRODUCTO';
};

const DataTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage,     setPerPage]     = usePageSize();
  const [searchTerm,  setSearchTerm]  = useState('');
  const [tipoFilter,  setTipoFilter]  = useState('');
  const [itemTraspaso, setItemTraspaso] = useState(null);
  const [itemAjuste,   setItemAjuste]   = useState(null);

  const id_bodega   = useBoundStore(state => state.activeBodegaId);
  const openConfirm = useBoundStore(state => state.openConfirm);

  const { isLoadingItems, items, isFetching, traspasoAsync, isTrashing,
          removeFromBodegaAsync, ajusteManualAsync, isAjustando } = useInventario(
    id_bodega, currentPage, perPage, searchTerm, tipoFilter,
  );
  const { bodegas } = useBodegas();

  const inventario = useMemo(() => items?.inventario || [], [items]);
  const pagination = items?.pagination || { totalPages: 1, totalItems: 0 };

  const getNombre    = (item) => item.nombre || item.nombre_item_general || '-';
  const getCodigo    = (item) => item.codigo || item.codigo_item_general || '-';
  const getId        = (item) => item.id_item_general || item.id || '-';
  const getPrecio    = (item) => item?.precio_venta   || '0';
  const getCostoUnit = (item) => item?.costo_unitario ?? '0';

  const getStockAlmacenaje = (item) => {
    const ev = parseFloat(item.escala_venta)      || null;
    const ea = parseFloat(item.escala_almacenaje) || null;
    if (!ea || !ev || !item.unidad_almacenaje) return null;
    const factor = ea / ev;
    const qty    = parseFloat(item.cantidad) || 0;
    return { total: qty / factor, nombre: item.unidad_almacenaje };
  };

  const handleSearchChange = (value) => { setSearchTerm(value); setCurrentPage(1); };
  const handleTipoChange   = (value) => { setTipoFilter(value); setCurrentPage(1); };

  const columns = useMemo(() => [
    {
      key: '__id', label: '#', align: 'center', className: 'w-16',
      render: (_v, item) => <span className="text-xs font-medium text-content-tertiary tabular-nums">{getId(item)}</span>,
    },
    {
      key: '__codigo', label: 'Código',
      render: (_v, item) => <span className="text-xs text-content-tertiary font-mono font-medium">{getCodigo(item)}</span>,
    },
    {
      key: '__nombre', label: 'Nombre',
      render: (_v, item) => (
        <span className="font-medium text-content-primary text-xs max-w-[260px] truncate block" title={getNombre(item)}>{getNombre(item)}</span>
      ),
    },
    {
      key: 'cantidad', label: 'Cantidad', align: 'center',
      render: (v) => <span className="text-xs font-semibold text-content-secondary tabular-nums">{v ?? '—'}</span>,
    },
    {
      key: '__almacenaje', label: 'Almacenaje', align: 'center',
      render: (_v, item) => {
        const s = getStockAlmacenaje(item);
        if (!s) return <span className="text-content-muted text-xs">—</span>;
        return (
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs font-semibold text-semantic-warning-fg tabular-nums">
              {s.total % 1 === 0 ? Math.floor(s.total) : s.total.toFixed(1)}
            </span>
            <span className="text-[9px] font-semibold text-semantic-warning uppercase tracking-wide">{s.nombre}</span>
          </div>
        );
      },
    },
    {
      key: 'tipo', label: 'Tipo', align: 'center',
      render: (v) => <StatusBadge estado={getTipoLabel(v)} dot={false} size="sm" fixedWidth />,
    },
    {
      key: 'unidad', label: 'Unidad', align: 'center',
      render: (v) => v ? <StatusBadge tone="neutral" label={v} dot={false} size="sm" /> : <span className="text-content-muted text-xs">—</span>,
    },
    {
      key: '__costo', label: 'Costo unit.', align: 'right',
      render: (_v, item) => <span className="text-xs text-content-secondary tabular-nums">{formatoPesoColombiano(getCostoUnit(item))}</span>,
    },
    {
      key: '__precio', label: 'Precio venta', align: 'right',
      render: (_v, item) => <span className="text-xs text-semantic-success-fg font-medium tabular-nums">{formatoPesoColombiano(getPrecio(item))}</span>,
    },
    {
      key: '__actions', label: 'Acciones', align: 'center', sortable: false,
      render: (_v, item) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => openConfirm({
              title:   'Eliminar item',
              message: `¿Eliminar "${getNombre(item)}" de esta bodega?`,
              onConfirm: async () => await removeFromBodegaAsync({
                itemId:   getId(item),
                bodegaId: id_bodega,
              }),
            })}
            title="Eliminar"
            className="inline-flex items-center justify-center w-7 h-7 rounded-sm border border-border-base text-content-tertiary hover:bg-semantic-danger hover:text-white hover:border-semantic-danger transition-colors"
          >
            <Trash2 size={12} />
          </button>
          <button
            onClick={() => setItemTraspaso(item)}
            title="Traspasar a otra bodega"
            className="inline-flex items-center justify-center w-7 h-7 rounded-sm border border-border-base text-content-tertiary hover:bg-semantic-info hover:text-white hover:border-semantic-info transition-colors"
          >
            <ArrowRightLeft size={12} />
          </button>
          <button
            onClick={() => setItemAjuste(item)}
            title="Ajuste manual (rotura, derrame, conteo)"
            className="inline-flex items-center justify-center w-7 h-7 rounded-sm border border-border-base text-content-tertiary hover:bg-semantic-warning hover:text-white hover:border-semantic-warning transition-colors"
          >
            <Wrench size={12} />
          </button>
        </div>
      ),
    },
  ], [id_bodega, openConfirm, removeFromBodegaAsync]);

  const rowsWithId = useMemo(
    () => inventario.map((item) => ({ ...item, id: getId(item) })),
    [inventario],
  );

  return (
    <>
      <NavTabs
        searchTerm={searchTerm}
        setSearchTerm={handleSearchChange}
        tipoFilter={tipoFilter}
        setTipoFilter={handleTipoChange}
        Page={setCurrentPage}
        isFetching={isFetching}
      />
      <div className="flex flex-col gap-3 w-full">
        <div className="bg-surface-base border border-border-base rounded-md shadow-xs w-full overflow-hidden">
          <ErpTable
            columns={columns}
            data={rowsWithId}
            isLoading={isLoadingItems}
            emptyMessage="No hay items para mostrar en este inventario."
            emptySubMessage="El stock se crea automáticamente al recibir órdenes de compra o cerrar órdenes de producción."
            borderless
          />

          {/* Paginación */}
          <div className="px-3 py-2 bg-surface-subtle border-t border-border-base flex items-center justify-between">
            <div className="hidden sm:flex items-center gap-4">
              {isFetching ? (
                <div className="h-7 w-48 bg-surface-muted animate-pulse rounded-md" />
              ) : (
                <>
                  <div className="text-xs text-content-tertiary">
                    Mostrando <span className="text-content-primary font-semibold tabular-nums">{inventario.length}</span>{' '}
                    de <span className="text-content-primary font-semibold tabular-nums">{pagination?.totalItems || 0}</span> items
                  </div>
                  <div className="flex items-center gap-2 border-l border-border-base pl-4">
                    <span className="text-xs text-content-tertiary">Filas:</span>
                    <select
                      value={perPage}
                      onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="bg-surface-base border border-border-base text-content-primary text-xs font-medium rounded-md focus:ring-2 focus:ring-border-focus/15 focus:border-border-focus block px-2 py-1 outline-none transition-colors"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isFetching}
                className="p-1.5 border border-border-base rounded-md bg-surface-base hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} />
              </button>

              <div className="flex items-center gap-1">
                {isFetching ? (
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-7 h-7 bg-surface-muted animate-pulse rounded-md" />
                    ))}
                  </div>
                ) : (
                  getPaginationRange(currentPage, pagination?.totalPages || 1).map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
                      disabled={page === '...' || isFetching}
                      className={cn(
                        'min-w-7 h-7 flex items-center justify-center rounded-md text-[11px] font-semibold transition-colors',
                        page === currentPage
                          ? 'bg-content-primary text-content-inverse'
                          : page === '...'
                            ? 'text-content-muted cursor-default'
                            : 'bg-surface-base border border-border-base text-content-secondary hover:border-border-strong hover:text-content-primary',
                      )}
                    >
                      {page}
                    </button>
                  ))
                )}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination?.totalPages || 1))}
                disabled={currentPage >= (pagination?.totalPages || 1) || isFetching}
                className="p-1.5 border border-border-base rounded-md bg-surface-base hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal />
      <ExcelModal data={items} tipoFilter={tipoFilter} searchTerm={searchTerm} />

      {itemTraspaso && (
        <TraspasoModal
          key={itemTraspaso.id_item_general}
          item={itemTraspaso}
          bodegas={bodegas}
          id_bodega={id_bodega}
          onClose={() => setItemTraspaso(null)}
          onConfirm={async (payload) => {
            await traspasoAsync(payload);
            setItemTraspaso(null);
          }}
          isSubmitting={isTrashing}
        />
      )}

      {itemAjuste && (
        <AjusteModal
          key={itemAjuste.id_item_general}
          item={itemAjuste}
          bodegaId={id_bodega}
          onClose={() => setItemAjuste(null)}
          onConfirm={async (payload) => {
            await ajusteManualAsync(payload);
            setItemAjuste(null);
          }}
          isSubmitting={isAjustando}
        />
      )}
    </>
  );
};

export default DataTable;
