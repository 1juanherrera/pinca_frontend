import { 
  Edit, 
  Trash2, 
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import { NavTabs } from './NavTabs';
import { handleType } from '../utils/handlers';
import { formatoPesoColombiano } from '../../../utils/formatters';
import { useState } from 'react';
import { SkeletonRow } from '../../../shared/Skeletons';
import { useInventario } from '../api/useInventario';
import { useItem } from '../api/useItem';
import ConfirmModal from '../../../shared/ConfirmModal';
import { getPaginationRange } from '../services/pagination';
import { ExcelModal } from './ExcelModal';

const DataTable = () => {

  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const id_bodega = useBoundStore(state => state.activeBodegaId);
  const openConfirm = useBoundStore(state => state.openConfirm);
  const openDrawer = useBoundStore(state => state.openDrawer);

  const { isLoadingItems, items, isFetching } = useInventario(
    id_bodega, 
    currentPage, 
    perPage, 
    searchTerm, 
    tipoFilter
  );
  console.log('render DataTable, primer item:', items?.inventario?.[0]?.nombre);
  const { removeAsync } = useItem();

  const handleEdit = (item) => {
    // 👇 Siempre pasar el item de la tabla directo, sin buscar en itemData
    openDrawer('ITEM_FORM', item);
  };

  const inventario = items?.inventario || [];
  const pagination = items?.pagination || { totalPages: 1, totalItems: 0 };

  const getNombre = (item) => item.nombre || item.nombre_item_general || '-';
  const getCodigo = (item) => item.codigo || item.codigo_item_general || '-';
  const getId = (item) => item.id_item_general || item.id || '-';
  const getPrecio = (item) => item?.precio_venta || '0';
  const getCostoGalon = (item) => item?.costo_mp_galon || '0';


  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleTipoChange = (value) => {
    setTipoFilter(value);
    setCurrentPage(1);
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
      />
      <div className="flex flex-col gap-3 w-full mt-2">
        <div className="bg-white border border-zinc-200/80 rounded-xl shadow-sm w-full overflow-hidden">
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-950 text-zinc-100 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="w-16 px-3 py-2 text-center">#</th>
                  <th className="px-3 py-2">CÓDIGO</th>
                  <th className="px-3 py-2">NOMBRE</th>
                  <th className="px-3 py-2 text-center">CANTIDAD</th>
                  <th className="px-3 py-2 text-center">TIPO</th>
                  <th className="px-3 py-2 text-center">UNIDAD</th>
                  <th className="px-3 py-2 text-right">COSTO</th>
                  <th className="px-3 py-2 text-right">PRECIO</th>
                  <th className="px-3 py-2 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80">
                {isLoadingItems ? (
                  /* ESTADO 1: CARGANDO */
                  Array.from({ length: 10 }).map((_, i) => (
                    <SkeletonRow key={`skeleton-${i}`} />
                  ))
                ) : inventario.length > 0 ? (
                  /* ESTADO 2: CON DATOS */
                  inventario.map((item, i) => (
                    <tr key={item.id_item_general || i} className={`hover:bg-zinc-100 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'}`}>
                      <td className="px-3 py-1 text-center text-xs font-medium text-zinc-500">{getId(item)}</td>
                      <td className="px-3 py-1"><span className="text-xs font-mono text-zinc-500 font-bold">{getCodigo(item)}</span></td>
                      <td className="px-3 py-1 font-semibold uppercase text-zinc-900 text-xs">{getNombre(item)}</td>
                      <td className="px-3 py-1 text-center text-xs font-bold text-zinc-700">{item.cantidad}</td>
                      
                      <td className="px-3 py-1 text-center">
                        <span className={`inline-flex w-32 justify-center shadow-md items-center px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${handleType(item.tipo)}`}>
                          {
                            String(item.tipo).includes('MATERIA') || item.tipo === '1' ? 'MATERIA PRIMA' :
                            String(item.tipo).includes('INSUMO') || item.tipo === '2' ? 'INSUMO' : 'PRODUCTO'
                          }
                        </span>
                      </td>
                      
                      <td className="px-3 py-1 font-semibold text-center uppercase text-zinc-900 text-xs">{item.unidad || '-'}</td>
                      <td className="px-3 py-1 text-right font-medium text-xs text-zinc-700">{formatoPesoColombiano(getCostoGalon(item))}</td>
                      <td className="px-3 py-1 text-right font-medium text-xs text-emerald-600">{formatoPesoColombiano(getPrecio(item))}</td>
                      
                      <td className="px-3 py-1">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                          onClick={() => handleEdit(item)}
                          className="flex items-center justify-center w-8 h-8 rounded bg-zinc-200 text-zinc-600 hover:bg-zinc-800 hover:text-white transition-all active:scale-95">
                            <Edit size={14} />
                          </button>
                          <button 
                          onClick={() => openConfirm({
                            title: "Eliminar Item",
                            message: `¿Estás seguro de que deseas eliminar el item "${getNombre(item)}"?`,
                            onConfirm: async () => {
                              await removeAsync(getId(item));
                            } 
                          })}
                          className="flex items-center justify-center w-8 h-8 rounded bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition-all active:scale-95">
                            <Trash2 size={14} />
                          </button>
                          <button className="flex items-center justify-center w-8 h-8 rounded bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all active:scale-95">
                            <ArrowRightLeft size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) 
                ) : (
                  /* ESTADO 3: VACÍO (Sin datos) */
                  <tr>
                    <td colSpan="9" className="px-3 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-zinc-500 h-64">
                        <span className="text-sm font-medium">No hay items para mostrar en este inventario.</span>
                        <span className="text-xs text-zinc-400 mt-1">Intenta ajustando tu búsqueda o agrega un nuevo item.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
            {/* Info de items */}
            <div className="hidden sm:flex items-center gap-4">
              {isFetching ? (
                <div className="h-8 w-48 bg-zinc-200 animate-pulse rounded-lg"></div>
              ) : (
                <>
                  <div className="text-xs text-zinc-500 font-medium">
                    Mostrando <span className="text-zinc-900 font-bold">{inventario.length}</span> de <span className="text-zinc-900 font-bold">{pagination?.totalItems || 0}</span> items
                  </div>
                  
                  <div className="flex items-center gap-2 border-l border-zinc-200 pl-4">
                    <span className="text-xs text-zinc-500 font-medium">Filas:</span>
                    <select
                      value={perPage}
                      onChange={(e) => {
                        setPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
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
              {/* Botón Anterior */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isFetching}
                className="p-2 border border-zinc-300 rounded-lg bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              
              {/* Números con Elipsis y Estado de Carga */}
              <div className="flex items-center gap-1">
                {isFetching ? (
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-8 h-8 bg-zinc-200 animate-pulse rounded-lg"></div>
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

              {/* Botón Siguiente */}
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
    </>
  );
}

export default DataTable;