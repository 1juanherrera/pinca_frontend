import { ArrowDownUp, PackageOpen, ArrowUpRight, ArrowDownLeft, Shuffle } from 'lucide-react';
import { fmt } from '../../../utils/formatters';

const getIconoMovimiento = (tipo) => {
  switch (tipo?.toUpperCase()) {
    case 'ENTRADA': return <ArrowDownLeft size={14} className="text-emerald-500" />;
    case 'SALIDA':  return <ArrowUpRight size={14} className="text-rose-500" />;
    case 'TRASPASO':return <Shuffle size={14} className="text-blue-500" />;
    default:        return <ArrowDownUp size={14} className="text-zinc-400" />;
  }
};

const getBadgeColor = (tipo) => {
  switch (tipo?.toUpperCase()) {
    case 'ENTRADA':  return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'SALIDA':   return 'bg-rose-50 text-rose-600 border-rose-100';
    case 'TRASPASO': return 'bg-blue-50 text-blue-600 border-blue-100';
    default:         return 'bg-zinc-50 text-zinc-600 border-zinc-100';
  }
};

export const MovimientosTable = ({ data, meta, isLoading, onPageChange }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
        <ArrowDownUp size={32} className="animate-bounce" />
        <p className="text-sm font-semibold">Cargando kardex...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100">
          <PackageOpen size={24} className="text-zinc-400" />
        </div>
        <p className="text-sm font-bold text-zinc-800">No hay movimientos registrados</p>
        <p className="text-xs text-zinc-400 max-w-sm">No se encontraron movimientos de inventario que coincidan con los filtros actuales.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 shadow-sm shadow-zinc-100/50">
            <tr>
              <th className="px-5 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 w-12 text-center">#</th>
              <th className="px-5 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 w-24">Fecha</th>
              <th className="px-5 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 w-32">Tipo</th>
              <th className="px-5 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">Producto</th>
              <th className="px-5 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 text-right">Cant.</th>
              <th className="px-5 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 text-right">Saldo</th>
              <th className="px-5 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 text-right">Costo Unit.</th>
              <th className="px-5 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">Origen / Ref</th>
              <th className="px-5 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 w-28">Responsable</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {data.map((mov) => {
              const sign = mov.tipo_movimiento === 'ENTRADA' ? '+' : (mov.tipo_movimiento === 'SALIDA' ? '-' : '');
              return (
                <tr key={mov.id_movimiento_inventario} className="group hover:bg-zinc-50/50 transition-colors">
                  <td className="px-5 py-2.5 text-xs text-zinc-400 font-mono text-center">
                    {mov.id_movimiento_inventario}
                  </td>
                  <td className="px-5 py-2.5">
                    <p className="text-xs font-semibold text-zinc-700">{new Date(mov.fecha_movimiento).toLocaleDateString('es-CO')}</p>
                    <p className="text-[10px] text-zinc-400 font-mono">{new Date(mov.fecha_movimiento).toLocaleTimeString('es-CO', {hour: '2-digit', minute:'2-digit'})}</p>
                  </td>
                  <td className="px-5 py-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold tracking-wide uppercase ${getBadgeColor(mov.tipo_movimiento)}`}>
                      {getIconoMovimiento(mov.tipo_movimiento)}
                      {mov.tipo_movimiento}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-zinc-800 truncate max-w-[200px]" title={mov.item_nombre}>
                        {mov.item_nombre || 'Ítem Eliminado'}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {mov.item_codigo} • {mov.bodega_nombre || 'Bodega 1'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <span className={`text-xs font-bold tabular-nums ${mov.tipo_movimiento === 'ENTRADA' ? 'text-emerald-600' : (mov.tipo_movimiento === 'SALIDA' ? 'text-rose-600' : 'text-blue-600')}`}>
                      {sign}{Number(mov.cantidad).toLocaleString('es-CO')}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-zinc-700 tabular-nums">
                        {Number(mov.saldo_nuevo).toLocaleString('es-CO')}
                      </span>
                      <span className="text-[9px] text-zinc-400 tabular-nums line-through">
                        {Number(mov.saldo_anterior).toLocaleString('es-CO')}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <span className="text-xs font-mono font-medium text-zinc-500">
                      {mov.costo_unitario > 0 ? fmt(mov.costo_unitario) : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="flex flex-col max-w-[180px]">
                      <span className="text-xs font-medium text-zinc-700 truncate" title={mov.descripcion}>
                        {mov.descripcion || '—'}
                      </span>
                      <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-bold mt-0.5">
                        {mov.referencia_tipo?.replace('_', ' ')} {mov.referencia_id ? `#${mov.referencia_id}` : ''}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200">
                        <span className="text-[9px] font-bold text-zinc-500">
                          {mov.responsable ? mov.responsable.substring(0, 1).toUpperCase() : '?'}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-zinc-600 truncate max-w-[80px]" title={mov.responsable}>
                        {mov.responsable || 'Sistema'}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación simple */}
      {meta && meta.pages > 1 && (
        <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between shrink-0">
          <p className="text-xs text-zinc-500 font-medium">
            Mostrando pág {meta.page} de {meta.pages} ({meta.total} movimientos)
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={meta.page <= 1}
              onClick={() => onPageChange(meta.page - 1)}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-600 rounded-lg hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              Anterior
            </button>
            <button
              disabled={meta.page >= meta.pages}
              onClick={() => onPageChange(meta.page + 1)}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-600 rounded-lg hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
