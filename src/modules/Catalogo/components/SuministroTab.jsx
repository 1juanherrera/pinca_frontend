import { Truck, Warehouse, Check, X as XIcon } from 'lucide-react';
import { fmt } from '../../../utils/formatters';

const SuministroTab = ({ proveedores = [], stockPorBodega = [] }) => {
  return (
    <div className="p-6 space-y-6">

      {/* Proveedores */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest flex items-center gap-2">
            <Truck size={14} className="text-zinc-400" />
            Proveedores Vinculados
          </h3>
          <span className="text-[10px] font-bold text-zinc-400 uppercase">
            {proveedores.length} proveedor{proveedores.length !== 1 ? 'es' : ''}
          </span>
        </div>

        {proveedores.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl">
            Este ítem no tiene proveedores vinculados
          </div>
        ) : (
          <div className="border border-zinc-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Proveedor</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Código</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Unid. Compra</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Factor</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Precio Unit.</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Precio + IVA</th>
                  <th className="text-center px-4 py-2.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Estado</th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map((prov, idx) => {
                  const disponible = Number(prov.disponible) === 1;
                  return (
                    <tr key={prov.id_item_proveedor || idx} className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-zinc-800 text-xs">{prov.nombre_empresa || prov.nombre_encargado || '—'}</p>
                        {prov.nombre && (
                          <p className="text-[10px] text-zinc-400 mt-0.5">{prov.nombre}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-zinc-500">{prov.codigo || '—'}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{prov.unidad_compra_nombre || '—'}</td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-zinc-600">
                        {prov.factor_conversion ? `×${parseFloat(prov.factor_conversion)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-zinc-700">
                        {prov.precio_unitario ? fmt(prov.precio_unitario) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-zinc-700">
                        {prov.precio_con_iva ? fmt(prov.precio_con_iva) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {disponible ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <Check size={10} /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-500 border border-red-200">
                            <XIcon size={10} /> Inactivo
                          </span>
                        )}
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
          <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest flex items-center gap-2">
            <Warehouse size={14} className="text-zinc-400" />
            Stock por Bodega
          </h3>
        </div>

        {stockPorBodega.length === 0 ? (
          <div className="py-6 text-center text-sm text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl">
            No hay existencias registradas
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stockPorBodega.map((bodega, idx) => (
              <div
                key={bodega.bodegas_id || idx}
                className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100"
              >
                <div>
                  <p className="text-xs font-bold text-zinc-700">{bodega.bodega_nombre || `Bodega ${bodega.bodegas_id}`}</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">{bodega.capas_activas} capa{bodega.capas_activas != 1 ? 's' : ''} activa{bodega.capas_activas != 1 ? 's' : ''}</p>
                </div>
                <span className="text-sm font-black text-emerald-700">
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
