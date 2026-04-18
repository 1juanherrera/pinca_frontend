import {
  Edit,
  Trash2,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Info,
  Pencil,
  Check,
  X as XIcon,
} from 'lucide-react';
import TamboresItemModal from './TamboresItemModal';
import { useBoundStore } from '../../../store/useBoundStore';
import { NavTabs } from './NavTabs';
import { handleType } from '../utils/handlers';
import { formatoPesoColombiano } from '../../../utils/formatters';
import { useState, useRef } from 'react';
import { SkeletonRow } from '../../../shared/Skeletons';
import { useInventario } from '../api/useInventario';
import ConfirmModal from '../../../shared/ConfirmModal';
import { getPaginationRange } from '../services/pagination';
import { ExcelModal } from './ExcelModal';
import { TraspasoModal } from './TraspasoModal';
import { useBodegas } from '../../Bodegas/api/useBodegas';

const DataTable = () => {

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage,     setPerPage]     = useState(10);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [tipoFilter,  setTipoFilter]  = useState('');
  const [itemTraspaso,  setItemTraspaso]  = useState(null);
  const [itemDetalle,   setItemDetalle]   = useState(null);
  const [editingCantidad, setEditingCantidad] = useState(null); // id_inventario en edición
  const [editVal,         setEditVal]         = useState('');
  const editInputRef = useRef(null);

  const id_bodega   = useBoundStore(state => state.activeBodegaId); // ← lista global de bodegas
  const openConfirm = useBoundStore(state => state.openConfirm);
  const openDrawer  = useBoundStore(state => state.openDrawer);

  const { isLoadingItems, items, isFetching, traspasoAsync, isTrashing,
          removeFromBodegaAsync, patchCantidadAsync, pendientesCount } = useInventario(
    id_bodega,
    currentPage,
    perPage,
    searchTerm,
    tipoFilter
  );
  const { bodegas } = useBodegas();

  const handleEdit = (item) => openDrawer('ITEM_FORM', item);

  const inventario = items?.inventario || [];
  const pagination = items?.pagination || { totalPages: 1, totalItems: 0 };

  const getNombre      = (item) => item.nombre || item.nombre_item_general || '-';
  const getCodigo      = (item) => item.codigo || item.codigo_item_general || '-';
  const getId          = (item) => item.id_item_general || item.id || '-';
  const getPrecio      = (item) => item?.precio_venta    || '0';
  const getCostoUnit   = (item) => item?.costo_unitario  ?? '0';

  // Convierte cantidad (en unidades de venta) a unidades de almacenaje
  const getStockAlmacenaje = (item) => {
    const ev = parseFloat(item.escala_venta)      || null;
    const ea = parseFloat(item.escala_almacenaje) || null;
    if (!ea || !ev || !item.unidad_almacenaje) return null;
    const factor = ea / ev;                // cuántas u. venta caben en 1 u. almacenaje
    const qty    = parseFloat(item.cantidad) || 0;
    const total  = qty / factor;
    return { total, nombre: item.unidad_almacenaje };
  };

  const handleSearchChange = (value) => { setSearchTerm(value); setCurrentPage(1); };
  const handleTipoChange   = (value) => { setTipoFilter(value); setCurrentPage(1); };

  const startEditCantidad = (item) => {
    setEditingCantidad(item.id_inventario);
    setEditVal(item.cantidad ?? '');
    setTimeout(() => editInputRef.current?.select(), 30);
  };

  const cancelEdit = () => { setEditingCantidad(null); setEditVal(''); };

  const confirmEdit = async (item) => {
    const val = parseFloat(editVal);
    if (isNaN(val) || val < 0) { cancelEdit(); return; }
    await patchCantidadAsync({ inventarioId: item.id_inventario, cantidad: val });
    cancelEdit();
  };

  return (
    <>
      <NavTabs
        searchTerm={searchTerm}
        setSearchTerm={handleSearchChange}
        tipoFilter={tipoFilter}
        setTipoFilter={handleTipoChange}
        Page={setCurrentPage}
        isFetching={isFetching}
        pendientesCount={pendientesCount}
      />
      <div className="flex flex-col gap-3 w-full">
        <div className="bg-white border border-zinc-200/80 rounded-xl shadow-sm w-full overflow-hidden">

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-900 text-zinc-100 text-xs font-bold uppercase tracking-widest">
                <tr>
                  <th className="w-16 px-3 py-2 text-center">#</th>
                  <th className="px-3 py-2">CÓDIGO</th>
                  <th className="px-3 py-2">NOMBRE</th>
                  <th className="px-3 py-2 text-center">CANTIDAD</th>
                  <th className="px-3 py-2 text-center">ALMACENAJE</th>
                  <th className="px-3 py-2 text-center">TIPO</th>
                  <th className="px-3 py-2 text-center">UNIDAD</th>
                  <th className="px-3 py-2 text-right">COSTO UNIT.</th>
                  <th className="px-3 py-2 text-right">PRECIO VENTA</th>
                  <th className="px-3 py-2 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoadingItems ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <SkeletonRow key={`skeleton-${i}`} />
                  ))
                ) : inventario.length > 0 ? (
                  inventario.map((item) => (
                    <tr
                      key={item.id_item_general}
                      className="hover:bg-zinc-100 transition-colors"
                    >
                      <td className="px-3 py-1 text-center text-xs font-medium text-zinc-500">{getId(item)}</td>
                      <td className="px-3 py-1"><span className="text-xs  text-zinc-500 font-bold">{getCodigo(item)}</span></td>
                      <td className="px-3 py-1 font-semibold uppercase text-zinc-900 text-xs">{getNombre(item)}</td>
                      <td className="px-3 py-1 text-center">
                        {editingCantidad === item.id_inventario ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              ref={editInputRef}
                              type="number" min="0" step="1"
                              value={editVal}
                              onChange={e => setEditVal(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') confirmEdit(item); if (e.key === 'Escape') cancelEdit(); }}
                              className="w-16 text-center text-xs font-bold border border-amber-400 rounded-lg px-1 py-1 focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white"
                            />
                            <button onClick={() => confirmEdit(item)} className="w-5 h-5 flex items-center justify-center rounded text-emerald-600 hover:bg-emerald-50 transition-all">
                              <Check size={11} />
                            </button>
                            <button onClick={cancelEdit} className="w-5 h-5 flex items-center justify-center rounded text-zinc-400 hover:bg-zinc-100 transition-all">
                              <XIcon size={11} />
                            </button>
                          </div>
                        ) : item.cantidad === null || item.cantidad === undefined ? (
                          <button
                            onClick={() => startEditCantidad(item)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-dashed border-amber-300 bg-amber-50 text-amber-600 text-[10px] font-semibold hover:bg-amber-100 transition-all group"
                          >
                            <Pencil size={9} className="group-hover:scale-110 transition-transform" />
                            Pendiente
                          </button>
                        ) : (
                          <button
                            onClick={() => startEditCantidad(item)}
                            className="text-xs font-bold text-zinc-700 hover:text-amber-600 transition-colors group"
                          >
                            {item.cantidad}
                          </button>
                        )}
                      </td>

                      <td className="px-3 py-1 text-center">
                        {(() => {
                          const s = getStockAlmacenaje(item);
                          if (!s) return <span className="text-zinc-300 text-xs">—</span>;
                          const enteros  = Math.floor(s.total);
                          return (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-xs font-bold text-amber-700 tabular-nums">
                                {s.total % 1 === 0 ? enteros : s.total.toFixed(1)}
                              </span>
                              <span className="text-[9px] font-semibold text-amber-500 uppercase tracking-wider">
                                {s.nombre}
                              </span>
                            </div>
                          );
                        })()}
                      </td>

                      <td className="px-3 py-1 text-center">
                        <span className={`inline-flex w-32 justify-center shadow-md items-center px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${handleType(item.tipo)}`}>
                          {
                            String(item.tipo).includes('MATERIA') || item.tipo === '1' ? 'MATERIA PRIMA' :
                            String(item.tipo).includes('INSUMO')  || item.tipo === '2' ? 'INSUMO' : 'PRODUCTO'
                          }
                        </span>
                      </td>

                      <td className="px-3 py-1 text-center">
                        {item.unidad ? (
                          <span className="block items-center px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-[10px] font-bold text-zinc-600 uppercase tracking-wide">
                            {item.unidad}
                          </span>
                        ) : (
                          <span className="text-zinc-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-3 py-1 text-right font-medium text-xs text-zinc-700">{formatoPesoColombiano(getCostoUnit(item))}</td>
                      <td className="px-3 py-1 text-right font-medium text-xs text-emerald-600">{formatoPesoColombiano(getPrecio(item))}</td>

                      <td className="px-3 py-1">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEdit(item)}
                            title="Editar"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all active:scale-95"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => openConfirm({
                              title:   'Eliminar Item',
                              message: `¿Eliminar "${getNombre(item)}" de esta bodega?`,
                              onConfirm: async () => await removeFromBodegaAsync({
                                itemId:   getId(item),
                                bodegaId: id_bodega,
                              }),
                            })}
                            title="Eliminar"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95"
                          >
                            <Trash2 size={12} />
                          </button>
                          <button
                            onClick={() => setItemTraspaso(item, id_bodega)}
                            title="Traspasar a otra bodega"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95"
                          >
                            <ArrowRightLeft size={12} />
                          </button>
                          <button
                            onClick={() => setItemDetalle(item)}
                            title="Ver tambores"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all active:scale-95"
                          >
                            <Info size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-3 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-zinc-500 h-40">
                        <span className="text-sm font-medium">No hay items para mostrar en este inventario.</span>
                        <span className="text-xs text-zinc-400 mt-1">Intenta ajustando tu búsqueda o agrega un nuevo item.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
            <div className="hidden sm:flex items-center gap-4">
              {isFetching ? (
                <div className="h-8 w-48 bg-zinc-200 animate-pulse rounded-lg" />
              ) : (
                <>
                  <div className="text-xs text-zinc-500 font-medium">
                    Mostrando <span className="text-zinc-900 font-bold">{inventario.length}</span> de <span className="text-zinc-900 font-bold">{pagination?.totalItems || 0}</span> items
                  </div>
                  <div className="flex items-center gap-2 border-l border-zinc-200 pl-4">
                    <span className="text-xs text-zinc-500 font-medium">Filas:</span>
                    <select
                      value={perPage}
                      onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="bg-white border border-zinc-300 text-zinc-900 text-xs font-bold rounded-lg focus:ring-zinc-950 focus:border-zinc-950 block p-1 px-2 outline-none transition-all hover:border-zinc-400"
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

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isFetching}
                className="p-2 border border-zinc-300 rounded-lg bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center gap-1">
                {isFetching ? (
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 bg-zinc-200 animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : (
                  getPaginationRange(currentPage, pagination?.totalPages || 1).map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
                      disabled={page === '...' || isFetching}
                      className={`min-w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all
                        ${page === currentPage
                          ? 'bg-zinc-950 text-white shadow-lg shadow-zinc-200'
                          : page === '...'
                            ? 'text-zinc-400 cursor-default'
                            : 'bg-white border border-zinc-300 text-zinc-600 hover:border-zinc-950 hover:text-zinc-950'
                        }`}
                    >
                      {page}
                    </button>
                  ))
                )}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination?.totalPages || 1))}
                disabled={currentPage >= (pagination?.totalPages || 1) || isFetching}
                className="p-2 border border-zinc-300 rounded-lg bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal />
      <ExcelModal
        data={items}
        tipoFilter={tipoFilter}
        searchTerm={searchTerm}
      />

      {itemDetalle && (
        <TamboresItemModal
          item={itemDetalle}
          bodegaId={id_bodega}
          onClose={() => setItemDetalle(null)}
        />
      )}

      {/* TraspasoModal — se monta solo cuando hay un item seleccionado */}
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