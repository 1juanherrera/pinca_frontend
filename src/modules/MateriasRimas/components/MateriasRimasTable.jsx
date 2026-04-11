import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Package, MapPin, DollarSign, Eye } from 'lucide-react';
import { fmt } from '../../../utils/formatters';

const MateriasRimasTable = ({
  materiasRimas,
  isLoading,
  error,
  pagination,
  totalItems,
  onPageChange,
  onPerPageChange
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRowExpansion = (itemId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedRows(newExpanded);
  };

  const formatBodegasList = (bodegas = []) => {
    return bodegas.map(b => `${b.nombre}: ${b.cantidad}`).join(', ');
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-zinc-600">Cargando materias primas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-2">Error al cargar los datos</p>
        <p className="text-zinc-500 text-sm">{error.message}</p>
      </div>
    );
  }

  if (materiasRimas.length === 0) {
    return (
      <div className="p-8 text-center">
        <Package className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
        <p className="text-zinc-600 mb-2">No se encontraron materias primas</p>
        <p className="text-zinc-500 text-sm">Intenta ajustar los filtros de búsqueda</p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalItems / pagination.perPage);

  return (
    <div className="overflow-hidden">
      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="w-10 px-4 py-3"></th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                Código / Producto
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                Categoría
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                Stock Total
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                Ubicaciones
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                Costo Unit.
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                Valor Total
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {materiasRimas.map((item) => (
              <React.Fragment key={item.id_item_general}>
                {/* Fila principal */}
                <tr className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleRowExpansion(item.id_item_general)}
                      className="p-1 hover:bg-zinc-200 rounded text-zinc-400 hover:text-zinc-600"
                    >
                      {expandedRows.has(item.id_item_general) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-900 text-sm">{item.nombre}</p>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">
                          {item.codigo}
                        </span>
                        {item.unidad && (
                          <span className="text-xs text-zinc-500">
                            • {item.unidad}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="text-xs px-2 py-1 bg-violet-100 text-violet-700 rounded-full">
                      {item.categoria || 'Sin categoría'}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="space-y-1">
                      <p className="font-bold text-zinc-900">{item.cantidad_total || 0}</p>
                      {item.cantidad_total > 0 && (
                        <p className="text-xs text-emerald-600">En stock</p>
                      )}
                      {item.cantidad_total === 0 && (
                        <p className="text-xs text-red-600">Sin stock</p>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3 text-zinc-400" />
                      <span className="text-sm font-semibold text-zinc-700">
                        {item.num_bodegas || 0}
                      </span>
                      <span className="text-xs text-zinc-500">bodega{item.num_bodegas !== 1 ? 's' : ''}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm text-zinc-900">
                      {item.costo_unitario ? fmt(item.costo_unitario) : '—'}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm font-bold text-zinc-900">
                      {item.valor_total ? fmt(item.valor_total) : '—'}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>

                {/* Fila expandida con detalles por bodega */}
                {expandedRows.has(item.id_item_general) && (
                  <tr>
                    <td colSpan="8" className="px-4 py-0">
                      <div className="border-l-2 border-violet-200 ml-6 pl-4 pb-4">
                        <h4 className="text-xs font-semibold text-zinc-700 mb-3 uppercase tracking-wide">
                          Distribución por Bodegas
                        </h4>
                        
                        {item.bodegas && item.bodegas.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {item.bodegas.map((bodega, index) => (
                              <div key={index} className="bg-zinc-50 rounded-lg p-3 border border-zinc-200">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-semibold text-zinc-900">
                                    {bodega.nombre}
                                  </p>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    bodega.cantidad > 0 
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {bodega.cantidad > 0 ? 'Con stock' : 'Sin stock'}
                                  </span>
                                </div>
                                <div className="space-y-1 text-xs text-zinc-600">
                                  <p>
                                    <span className="font-medium">Cantidad:</span> {bodega.cantidad}
                                    {item.unidad && ` ${item.unidad}`}
                                  </p>
                                  {bodega.costo_unitario > 0 && (
                                    <p>
                                      <span className="font-medium">Costo Unit.:</span> {fmt(bodega.costo_unitario)}
                                    </p>
                                  )}
                                  {bodega.costo_unitario > 0 && bodega.cantidad > 0 && (
                                    <p>
                                      <span className="font-medium">Valor Total:</span>{' '}
                                      <span className="font-bold text-emerald-600">
                                        {fmt(bodega.cantidad * bodega.costo_unitario)}
                                      </span>
                                    </p>
                                  )}
                                  {bodega.sede && (
                                    <p>
                                      <span className="font-medium">Sede:</span> {bodega.sede}
                                    </p>
                                  )}
                                  {bodega.fecha_update && (
                                    <p>
                                      <span className="font-medium">Actualizado:</span>{' '}
                                      {new Date(bodega.fecha_update).toLocaleDateString('es-CO')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-500 italic">
                            No hay información detallada de bodegas disponible
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200 bg-white">
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <span>Mostrar</span>
            <select
              value={pagination.perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              className="px-2 py-1 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>elementos por página</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border border-zinc-300 rounded hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            <span className="text-sm text-zinc-600">
              Página {pagination.page} de {totalPages}
            </span>
            
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
              className="px-3 py-1 text-sm border border-zinc-300 rounded hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MateriasRimasTable;