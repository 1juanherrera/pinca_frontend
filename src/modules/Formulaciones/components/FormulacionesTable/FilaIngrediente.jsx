import { Beaker, Truck, AlertTriangle } from 'lucide-react';
import { fmtCOP } from './helpers';
import { IngredienteProveedorSelect } from './IngredienteProveedorSelect';

export const FilaIngrediente = ({
  formulacion, index, costoOverride, mpId, opciones, tieneProveedor, esAgua,
  selectedProveedorId, onSelectProveedor, recalculatedData, prov, ultimoPrecio,
}) => (
  <tr className={`transition-colors ${costoOverride ? 'bg-semantic-warning-subtle/40 hover:bg-semantic-warning-subtle/70' : 'hover:bg-surface-subtle'}`}>
    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-content-primary">
      {index + 1}
    </td>

    {/* MATERIA PRIMA + SELECTOR PROVEEDOR */}
    <td className="px-3 py-2">
      <div className="flex items-center">
        <div className={`shrink-0 h-7 w-7 rounded-full bg-surface-base flex items-center justify-center shadow-inner ${tieneProveedor || esAgua ? 'border border-semantic-info/20' : 'border border-semantic-warning/40'}`}>
          {tieneProveedor || esAgua
            ? <Beaker className="h-4 w-4 text-semantic-info-fg" />
            : <AlertTriangle className="h-3.5 w-3.5 text-semantic-warning-fg" />
          }
        </div>
        <div className="ml-3 min-w-0">
          <div className="text-xs font-semibold text-content-primary uppercase tracking-tight truncate" title={formulacion.materia_prima_nombre || 'Sin nombre'}>
            {formulacion.materia_prima_nombre || 'Sin nombre'}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs text-semantic-info-fg font-medium">
              {formulacion.materia_prima_codigo || 'Sin código'}
            </span>
            {formulacion.nota && (
              <span className="inline-flex items-center max-w-[100px] min-w-0 truncate text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-muted text-content-secondary border border-border-base" title={formulacion.nota}>
                {formulacion.nota}
              </span>
            )}
            {opciones.length > 0 && onSelectProveedor ? (
              <IngredienteProveedorSelect
                opciones={opciones}
                selectedId={selectedProveedorId ?? null}
                onSelect={(ipId) => onSelectProveedor(mpId, ipId)}
              />
            ) : esAgua ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-semantic-info-subtle text-semantic-info-fg border border-semantic-info/20">
                Costo interno
              </span>
            ) : onSelectProveedor && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-semantic-danger-subtle text-semantic-danger-fg border border-semantic-danger/20">
                <AlertTriangle size={9} /> Sin proveedor
              </span>
            )}
          </div>
        </div>
      </div>
    </td>

    {/* CANTIDAD */}
    <td className="px-3 py-2 whitespace-nowrap text-center">
      <div className={`text-sm font-bold ${recalculatedData ? 'text-semantic-success-fg' : 'text-semantic-info-fg'}`}>
        {recalculatedData == null ? formulacion.cantidad : formulacion.cantidad_recalculada ?? 0}
        {recalculatedData && (
          <div className="text-[10px] text-content-tertiary font-normal italic tracking-tighter">
            Base: {formulacion.cantidad ?? 0}
          </div>
        )}
      </div>
    </td>

    {/* CANTIDAD DISPONIBLE */}
    <td className="px-3 py-2 whitespace-nowrap text-center">
      {(() => {
        const cantidadRef = recalculatedData
          ? (formulacion.cantidad_recalculada ?? formulacion.cantidad)
          : formulacion.cantidad;
        const suficiente = formulacion.inventario_cantidad >= cantidadRef;
        return (
          <div className={`text-sm font-bold ${suficiente ? 'text-semantic-success-fg' : 'text-semantic-danger-fg'}`}>
            {formulacion.inventario_cantidad ?? 0}
            <div className={`text-[10px] font-normal ${suficiente ? 'text-semantic-success' : 'text-semantic-danger'}`}>
              {suficiente ? 'Suficiente' : 'Insuficiente'}
            </div>
          </div>
        );
      })()}
    </td>

    {/* COSTO UNITARIO */}
    <td className="px-3 py-2 whitespace-nowrap text-center">
      {(() => {
        if (costoOverride) {
          return (
            <div>
              <div className="text-sm font-bold text-semantic-warning-fg">
                {fmtCOP(costoOverride.costo_unitario)}
              </div>
              <div className="text-[10px] text-content-muted font-normal italic tracking-tighter flex items-center justify-center gap-0.5">
                <Truck size={8} /> {costoOverride.nombre_empresa}
              </div>
            </div>
          );
        }
        if (prov) {
          return (
            <div>
              <div className={`text-sm font-bold ${prov.usa_precio_proveedor ? 'text-semantic-warning-fg' : 'text-semantic-success-fg'}`}>
                $ {prov.costo_unitario_efectivo}
              </div>
              {prov.usa_precio_proveedor && (
                <div className="text-[10px] text-content-muted font-normal italic tracking-tighter flex items-center justify-center gap-0.5">
                  <Truck size={8} /> Prov.
                  <span className="ml-1 line-through">$ {prov.costo_unitario_estandar}</span>
                </div>
              )}
              {!prov.usa_precio_proveedor && (
                <div className="text-[10px] text-content-muted font-normal italic">Estándar</div>
              )}
            </div>
          );
        }
        return (
          <div className="text-sm font-bold text-semantic-success-fg">
            {formulacion.materia_prima_costo_unitario ?? 0}
          </div>
        );
      })()}
    </td>

    {/* ÚLTIMO PRECIO (informativo, capa más reciente) */}
    <td className="px-3 py-2 whitespace-nowrap text-center">
      {ultimoPrecio
        ? <span className="text-sm font-medium text-content-secondary">{fmtCOP(ultimoPrecio)}</span>
        : <span className="text-sm text-content-muted">—</span>}
    </td>

    {/* COSTO TOTAL */}
    <td className="px-3 py-2 whitespace-nowrap text-center">
      {(() => {
        if (costoOverride) {
          return (
            <div>
              <div className="text-sm font-bold text-semantic-warning-fg">
                {fmtCOP(costoOverride.costo_total)}
              </div>
              <div className="text-[10px] text-content-muted font-normal italic tracking-tighter">
                <span className="line-through">
                  $ {recalculatedData == null
                    ? formulacion.costo_total_materia
                    : formulacion.costo_total_materia_recalculado ?? 0}
                </span>
              </div>
            </div>
          );
        }
        if (prov) {
          return (
            <div>
              <div className={`text-sm font-bold ${prov.usa_precio_proveedor ? 'text-semantic-warning-fg' : 'text-semantic-success-fg'}`}>
                $ {prov.costo_total_proveedor}
              </div>
              {prov.usa_precio_proveedor && (
                <div className="text-[10px] text-content-muted font-normal italic tracking-tighter">
                  <span className="line-through">$ {prov.costo_total_estandar}</span>
                </div>
              )}
            </div>
          );
        }
        return (
          <div className="text-sm font-bold text-semantic-success-fg">
            {recalculatedData == null ? formulacion.costo_total_materia : formulacion.costo_total_materia_recalculado ?? 0}
            {recalculatedData && (
              <div className="text-[10px] text-content-tertiary font-normal italic tracking-tighter">
                Base: {formulacion.costo_total_materia ?? 0}
              </div>
            )}
          </div>
        );
      })()}
    </td>
  </tr>
);

export default FilaIngrediente;
