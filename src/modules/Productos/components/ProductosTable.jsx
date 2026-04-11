import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Boxes, Tag } from 'lucide-react';
import { fmt } from '../../../utils/formatters';

const ProductosTable = ({
  productos,
  isLoading,
  error,
  pagination,
  totalItems,
  onPageChange,
  onPerPageChange,
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    const next = new Set(expandedRows);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedRows(next);
  };

  const totalPages = Math.ceil(totalItems / pagination.perPage);
  const from = (pagination.page - 1) * pagination.perPage + 1;
  const to   = Math.min(pagination.page * pagination.perPage, totalItems);

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm text-zinc-500">Cargando productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-red-600 mb-1">Error al cargar los datos</p>
        <p className="text-xs text-zinc-400">{error.message}</p>
      </div>
    );
  }

  if (!productos.length) {
    return (
      <div className="py-16 text-center">
        <Boxes className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
        <p className="text-sm text-zinc-500">No se encontraron productos</p>
        <p className="text-xs text-zinc-400 mt-1">Intenta ajustar los filtros</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="w-8 px-3 py-2" />
              <th className="text-left px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Código / Producto
              </th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Categoría
              </th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Stock total
              </th>
              <th className="text-center px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Almacenaje
              </th>
              <th className="text-center px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Bodegas
              </th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Costo unit.
              </th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Valor total
              </th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Precio Venta
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {productos.map((item) => {
              const isExpanded = expandedRows.has(item.id_item_general);
              const sinStock   = !item.cantidad_total || item.cantidad_total === 0;

              return (
                <React.Fragment key={item.id_item_general}>
                  <tr
                    className="hover:bg-zinc-50 transition-colors cursor-pointer"
                    onClick={() => toggleRow(item.id_item_general)}
                  >
                    <td className="px-3 py-2 text-zinc-400">
                      {isExpanded
                        ? <ChevronDown className="w-3.5 h-3.5" />
                        : <ChevronRight className="w-3.5 h-3.5" />
                      }
                    </td>

                    <td className="px-3 py-2">
                      <p className="font-medium text-zinc-900 leading-snug">{item.nombre}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] bg-zinc-100 px-1.5 py-px rounded text-zinc-500">
                          {item.codigo}
                        </span>
                        {item.unidad && (
                          <span className="text-[11px] text-zinc-400">{item.unidad}</span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-2">
                      <span className="inline-block text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                        {item.categoria || 'Sin categoría'}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-right">
                      <span className={`font-semibold tabular-nums ${sinStock ? 'text-red-500' : 'text-zinc-900'}`}>
                        {item.cantidad_total ?? 0}
                      </span>
                      {sinStock && (
                        <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-red-400 align-middle" />
                      )}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {(() => {
                        const ev = item.escala_venta;
                        const ea = item.escala_almacenaje;
                        if (!ev || !ea || !item.unidad_almacenaje) return <span className="text-zinc-300 text-xs">—</span>;
                        const factor = ea / ev;
                        const qty    = (item.cantidad_total || 0) / factor;
                        return (
                          <div className="flex flex-col items-center gap-0">
                            <span className="text-xs font-bold text-amber-700 tabular-nums">
                              {qty % 1 === 0 ? qty : qty.toFixed(1)}
                            </span>
                            <span className="text-[9px] font-semibold text-amber-500 uppercase tracking-wider leading-none">
                              {item.unidad_almacenaje}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="px-3 py-2 text-center">
                      <span className="text-zinc-600 tabular-nums">{item.num_bodegas ?? 0}</span>
                    </td>

                    <td className="px-3 py-2 text-right font-mono text-zinc-600 tabular-nums">
                      {item.costo_unitario ? fmt(item.costo_unitario) : '—'}
                    </td>

                    <td className="px-3 py-2 text-right font-mono font-semibold text-zinc-900 tabular-nums">
                      {item.valor_total ? fmt(item.valor_total) : '—'}
                    </td>

                    <td className="px-3 py-2 text-right">
                      {item.precio_manual_activo && item.precio_venta_manual ? (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                            {fmt(item.precio_venta_manual)}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-px rounded-full">
                            <Tag size={8} /> Manual
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>

                  {/* Detalle por bodega */}
                  {isExpanded && (
                    <tr className="bg-zinc-50/60">
                      <td colSpan="9" className="px-3 py-0">
                        <div className="ml-5 border-l-2 border-blue-200 pl-4 py-3">
                          {item.bodegas && item.bodegas.length > 0 ? (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-zinc-400 uppercase tracking-wide">
                                  <th className="text-left pb-1.5 font-semibold">Bodega</th>
                                  <th className="text-right pb-1.5 font-semibold">Cantidad</th>
                                  <th className="text-right pb-1.5 font-semibold">Costo unit.</th>
                                  <th className="text-right pb-1.5 font-semibold">Valor</th>
                                  <th className="text-left pb-1.5 font-semibold pl-4">Sede</th>
                                  <th className="text-left pb-1.5 font-semibold pl-4">Actualizado</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-200">
                                {item.bodegas.map((bodega, i) => (
                                  <tr key={i}>
                                    <td className="py-1.5 font-medium text-zinc-700">{bodega.nombre}</td>
                                    <td className="py-1.5 text-right tabular-nums">
                                      <span className={bodega.cantidad > 0 ? 'text-zinc-800' : 'text-red-400'}>
                                        {bodega.cantidad}{item.unidad ? ` ${item.unidad}` : ''}
                                      </span>
                                    </td>
                                    <td className="py-1.5 text-right tabular-nums font-mono text-zinc-600">
                                      {bodega.costo_unitario > 0 ? fmt(bodega.costo_unitario) : '—'}
                                    </td>
                                    <td className="py-1.5 text-right tabular-nums font-mono font-semibold text-zinc-800">
                                      {bodega.costo_unitario > 0 && bodega.cantidad > 0
                                        ? fmt(bodega.cantidad * bodega.costo_unitario)
                                        : '—'}
                                    </td>
                                    <td className="py-1.5 pl-4 text-zinc-500">{bodega.sede || '—'}</td>
                                    <td className="py-1.5 pl-4 text-zinc-400">
                                      {bodega.fecha_update
                                        ? new Date(bodega.fecha_update).toLocaleDateString('es-CO')
                                        : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p className="text-xs text-zinc-400 italic">Sin detalle de bodegas</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-100 bg-white">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Filas:</span>
          <select
            value={pagination.perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="border border-zinc-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          >
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          {totalItems > 0 && (
            <span className="text-zinc-400">{from}–{to} de {totalItems}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => onPageChange(1)} disabled={pagination.page <= 1}
            className="px-2 py-1 text-xs border border-zinc-200 rounded hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed">«</button>
          <button onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page <= 1}
            className="px-2 py-1 text-xs border border-zinc-200 rounded hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
          <span className="px-3 py-1 text-xs text-zinc-600">{pagination.page} / {totalPages}</span>
          <button onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= totalPages}
            className="px-2 py-1 text-xs border border-zinc-200 rounded hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed">›</button>
          <button onClick={() => onPageChange(totalPages)} disabled={pagination.page >= totalPages}
            className="px-2 py-1 text-xs border border-zinc-200 rounded hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed">»</button>
        </div>
      </div>
    </div>
  );
};

export default ProductosTable;
