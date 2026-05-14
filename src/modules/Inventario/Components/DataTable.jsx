import {
  Trash2,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import TamboresItemModal from './TamboresItemModal';
import { useBoundStore } from '../../../store/useBoundStore';
import { NavTabs } from './NavTabs';
import { formatoPesoColombiano } from '../../../utils/formatters';
import { useState } from 'react';
import { SkeletonRow } from '../../../shared/Skeletons';
import { useInventario } from '../api/useInventario';
import ConfirmModal from '../../../shared/ConfirmModal';
import StatusBadge from '../../../shared/StatusBadge';
import { getPaginationRange } from '../services/pagination';
import { ExcelModal } from './ExcelModal';
import { TraspasoModal } from './TraspasoModal';
import { useBodegas } from '../../Bodegas/api/useBodegas';
import cn from '../../../utils/cn';

const getTipoLabel = (tipo) => {
  if (String(tipo).includes('MATERIA') || tipo === '1') return 'MATERIA PRIMA';
  if (String(tipo).includes('INSUMO')  || tipo === '2') return 'INSUMO';
  return 'PRODUCTO';
};

const DataTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage,     setPerPage]     = useState(10);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [tipoFilter,  setTipoFilter]  = useState('');
  const [itemTraspaso, setItemTraspaso] = useState(null);
  const [itemDetalle,  setItemDetalle]  = useState(null);

  const id_bodega   = useBoundStore(state => state.activeBodegaId);
  const openConfirm = useBoundStore(state => state.openConfirm);

  const { isLoadingItems, items, isFetching, traspasoAsync, isTrashing,
          removeFromBodegaAsync } = useInventario(
    id_bodega, currentPage, perPage, searchTerm, tipoFilter,
  );
  const { bodegas } = useBodegas();

  const inventario = items?.inventario || [];
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
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-surface-muted border-b border-border-base">
                <tr>
                  {['#','Código','Nombre'].map((h, i) => (
                    <th key={h} className={cn(
                      'px-3 py-2 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider',
                      i === 0 && 'w-16 text-center',
                    )}>{h}</th>
                  ))}
                  <th className="px-3 py-2 text-center text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Cantidad</th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Almacenaje</th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Tipo</th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Unidad</th>
                  <th className="px-3 py-2 text-right  text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Costo unit.</th>
                  <th className="px-3 py-2 text-right  text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Precio venta</th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {isLoadingItems ? (
                  Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={`skeleton-${i}`} />)
                ) : inventario.length > 0 ? (
                  inventario.map((item) => (
                    <tr key={item.id_item_general} className="hover:bg-surface-subtle transition-colors">
                      <td className="px-3 py-1.5 text-center text-xs font-medium text-content-tertiary tabular-nums">{getId(item)}</td>
                      <td className="px-3 py-1.5">
                        <span className="text-xs text-content-tertiary font-mono font-medium">{getCodigo(item)}</span>
                      </td>
                      <td className="px-3 py-1.5 font-medium text-content-primary text-xs">{getNombre(item)}</td>
                      <td className="px-3 py-1.5 text-center">
                        <span className="text-xs font-semibold text-content-secondary tabular-nums">
                          {item.cantidad ?? '—'}
                        </span>
                      </td>

                      <td className="px-3 py-1.5 text-center">
                        {(() => {
                          const s = getStockAlmacenaje(item);
                          if (!s) return <span className="text-content-muted text-xs">—</span>;
                          return (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-xs font-semibold text-semantic-warning-fg tabular-nums">
                                {s.total % 1 === 0 ? Math.floor(s.total) : s.total.toFixed(1)}
                              </span>
                              <span className="text-[9px] font-semibold text-semantic-warning uppercase tracking-wide">
                                {s.nombre}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      <td className="px-3 py-1.5.5 text-center">
                        <StatusBadge
                          estado={getTipoLabel(item.tipo)}
                          dot={false}
                          size="sm"
                          fixedWidth
                        />
                      </td>

                      <td className="px-3 py-1.5.5 text-center">
                        {item.unidad ? (
                          <StatusBadge tone="neutral" label={item.unidad} dot={false} size="sm" />
                        ) : (
                          <span className="text-content-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5 text-right text-xs text-content-secondary tabular-nums">
                        {formatoPesoColombiano(getCostoUnit(item))}
                      </td>
                      <td className="px-3 py-1.5 text-right text-xs text-semantic-success-fg font-medium tabular-nums">
                        {formatoPesoColombiano(getPrecio(item))}
                      </td>

                      <td className="px-3 py-1.5">
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
                            onClick={() => setItemDetalle(item)}
                            title="Ver tambores"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-sm border border-border-base text-content-tertiary hover:bg-semantic-warning hover:text-white hover:border-semantic-warning transition-colors"
                          >
                            <Info size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-3 py-1.56 text-center">
                      <div className="flex flex-col items-center justify-center text-content-tertiary h-40">
                        <span className="text-sm font-medium">No hay items para mostrar en este inventario.</span>
                        <span className="text-xs text-content-muted mt-1">
                          El stock se crea automáticamente al recibir órdenes de compra o cerrar órdenes de producción.
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

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

      {itemDetalle && (
        <TamboresItemModal
          item={itemDetalle}
          bodegaId={id_bodega}
          onClose={() => setItemDetalle(null)}
        />
      )}

      {itemTraspaso && (
        <TraspasoModal
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
    </>
  );
};

export default DataTable;
