import { 
  Edit, 
  Trash2, 
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import { useBodegas } from '../../Bodegas/api/useBodegas';
import NavTabs from './NavTabs';
import { handleType } from '../utils/handlers';
import { formatoPesoColombiano } from '../../../utils/formatters';
import { useState } from 'react';
import { SkeletonRow } from '../../../shared/Skeletons';

const DataTable = () => {

  const [currentPage, setCurrentPage] = useState(1);
  const id_bodega = useBoundStore(state => state.activeBodegaId);

  // Pasamos la página actual al hook
  const { items, isLoadingItems } = useBodegas(id_bodega, currentPage);

  const inventario = items?.inventario || [];
  const pagination = items?.pagination || { totalPages: 1, totalItems: 0 };

  const getNombre = (item) => item?.nombre_item_general || item.nombre || '-';
  const getCodigo = (item) => item?.codigo_item_general || item.codigo || '-';
  const getTipo = (item) => (item?.nombre_tipo || item.tipo || '-').toUpperCase();
  const getPrecio = (item) => item?.precio_venta || '0';
  const getId = (item) => item?.id_item_general || item.id || '-';
  const getCostoGalon = (item) => item?.costo_mp_galon || '0';

  return (
    <>
      <NavTabs />
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
                  Array.from({ length: 10 }).map((_, i) => (
                    <SkeletonRow key={`skeleton-${i}`} />
                  ))
                ) : (
                  inventario.map((item, i) => (
                    <tr key={item.id_item_general || i} className={`hover:bg-zinc-100 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'}`}>
                      <td className="px-3 py-1 text-center text-xs font-medium text-zinc-500">{getId(item)}</td>
                      <td className="px-3 py-1"><span className="text-xs font-mono text-zinc-500 font-bold">{getCodigo(item)}</span></td>
                      <td className="px-3 py-1 font-semibold uppercase text-zinc-900 text-xs">{getNombre(item)}</td>
                      <td className="px-3 py-1 text-center text-xs font-bold text-zinc-700">{item.cantidad}</td>
                      
                      <td className="px-3 py-1 text-center">
                        <span className={`inline-flex w-32 justify-center items-center px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${handleType(getTipo(item))}`}>
                          {
                            getTipo(item) === '0' ? 'PRODUCTO' : 
                            getTipo(item) === '1' ? 'MATERIA PRIMA' : 
                            getTipo(item) === '2' ? 'INSUMO' : getTipo(item)
                          }
                        </span>
                      </td>
                      
                      <td className="px-3 py-1 font-semibold text-center uppercase text-zinc-900 text-xs">{item.unidad || '-'}</td>
                      <td className="px-3 py-1 text-right font-medium text-xs text-zinc-700">{formatoPesoColombiano(getCostoGalon(item))}</td>
                      <td className="px-3 py-1 text-right font-medium text-xs text-emerald-600">{formatoPesoColombiano(getPrecio(item))}</td>
                      
                      <td className="px-3 py-1">
                        <div className="flex items-center justify-center gap-1.5">
                          <button className="flex items-center justify-center w-8 h-8 rounded bg-zinc-100 text-zinc-600 hover:bg-zinc-800 hover:text-white transition-all active:scale-95">
                            <Edit size={14} />
                          </button>
                          <button className="flex items-center justify-center w-8 h-8 rounded bg-red-100 text-red-600 hover:bg-red-500 hover:text-white transition-all active:scale-95">
                            <Trash2 size={14} />
                          </button>
                          <button className="flex items-center justify-center w-8 h-8 rounded bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all active:scale-95">
                            <ArrowRightLeft size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER DE PAGINACIÓN */}
          <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between">
            <div className="text-xs text-zinc-500 font-medium">
              Mostrando <span className="text-zinc-900">{inventario.length}</span> de <span className="text-zinc-900">{pagination?.totalItems || 0}</span> items
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || isLoadingItems}
                className="p-1.5 border border-zinc-300 rounded-lg bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="text-xs font-bold text-zinc-700">
                Página {currentPage} de {pagination?.totalPages || 1}
              </div>

              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage >= (pagination?.totalPages || 1) || isLoadingItems}
                className="p-1.5 border border-zinc-300 rounded-lg bg-white hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DataTable;