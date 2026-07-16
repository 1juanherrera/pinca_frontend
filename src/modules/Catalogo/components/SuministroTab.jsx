import { Truck, Warehouse, Check, X as XIcon } from 'lucide-react';
import { fmt } from '../../../utils/formatters';
import StatusBadge from '../../../shared/StatusBadge';

const SuministroTab = ({ proveedores = [], stockPorBodega = [] }) => {
  return (
    <div className="p-6 space-y-6">

      {/* Proveedores */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-content-primary uppercase tracking-widest flex items-center gap-2">
            <Truck size={14} className="text-content-muted" />
            Proveedores Vinculados
          </h3>
          <span className="text-[10px] font-bold text-content-muted uppercase">
            {proveedores.length} proveedor{proveedores.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {proveedores.length === 0 ? (
          <div className="py-8 text-center text-sm text-content-muted border-2 border-dashed border-border-base rounded-xl">
            Este ítem no tiene proveedores vinculados
          </div>
        ) : (
          <div className="border border-border-base rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-subtle border-b border-border-base">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-content-muted uppercase tracking-widest">Proveedor</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-content-muted uppercase tracking-widest">Código</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-content-muted uppercase tracking-widest">Unid. Compra</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold text-content-muted uppercase tracking-widest">Factor</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold text-content-muted uppercase tracking-widest">Precio Unit.</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold text-content-muted uppercase tracking-widest">Precio + IVA</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold text-content-muted uppercase tracking-widest">Estado</th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map((prov, idx) => {
                  const disponible = Number(prov.disponible) === 1;
                  return (
                    <tr key={prov.id_item_proveedor || idx} className="border-b border-border-subtle last:border-b-0 hover:bg-surface-subtle/50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-content-primary text-xs">{prov.nombre_empresa || prov.nombre_encargado || '—'}</p>
                        {prov.nombre && (
                          <p className="text-[10px] text-content-muted mt-0.5">{prov.nombre}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-content-tertiary">{prov.codigo || '—'}</td>
                      <td className="px-4 py-3 text-xs text-content-tertiary">{prov.unidad_compra_nombre || '—'}</td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-content-secondary">
                        {prov.factor_conversion ? `×${parseFloat(prov.factor_conversion)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-content-secondary">
                        {prov.precio_unitario ? fmt(prov.precio_unitario) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-content-secondary">
                        {prov.precio_con_iva ? fmt(prov.precio_con_iva) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {disponible
                          ? <StatusBadge tone="success" label="Activo"   icon={Check} dot={false} size="sm" />
                          : <StatusBadge tone="danger"  label="Inactivo" icon={XIcon} dot={false} size="sm" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock por bodega */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-content-primary uppercase tracking-widest flex items-center gap-2">
            <Warehouse size={14} className="text-content-muted" />
            Stock por Bodega
          </h3>
        </div>

        {stockPorBodega.length === 0 ? (
          <div className="py-6 text-center text-sm text-content-muted border-2 border-dashed border-border-base rounded-xl">
            No hay existencias registradas
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stockPorBodega.map((bodega, idx) => (
              <div
                key={bodega.bodegas_id || idx}
                className="flex items-center justify-between p-3 bg-surface-subtle rounded-xl border border-border-subtle"
              >
                <div>
                  <p className="text-xs font-bold text-content-secondary">{bodega.bodega_nombre || `Bodega ${bodega.bodegas_id}`}</p>
                  <p className="text-[10px] text-content-muted mt-0.5">{bodega.capas_activas} capa{bodega.capas_activas != 1 ? 's' : ''} activa{bodega.capas_activas != 1 ? 's' : ''}</p>
                </div>
                <span className="text-sm font-black text-semantic-success-fg">
                  {parseFloat(bodega.cantidad).toLocaleString('es-CO', { maximumFractionDigits: 2 })} kg
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuministroTab;
