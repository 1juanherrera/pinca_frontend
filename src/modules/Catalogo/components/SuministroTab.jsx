import { useMemo } from 'react';
import { Truck, Warehouse, Check, X as XIcon } from 'lucide-react';
import { fmt } from '../../../utils/formatters';
import StatusBadge from '../../../shared/StatusBadge';
import ErpTable from '../../../shared/ErpTable';

const PROVEEDORES_COLUMNS = [
  {
    key: 'nombre_empresa', label: 'Proveedor',
    render: (v, prov) => (
      <>
        <p className="font-semibold text-content-primary text-xs">{v || prov.nombre_encargado || '—'}</p>
        {prov.nombre && <p className="text-[10px] text-content-muted mt-0.5">{prov.nombre}</p>}
      </>
    ),
  },
  {
    key: 'codigo', label: 'Código',
    render: (v) => <span className="text-xs font-mono text-content-tertiary">{v || '—'}</span>,
  },
  {
    key: 'unidad_compra_nombre', label: 'Unid. Compra',
    render: (v) => <span className="text-xs text-content-tertiary">{v || '—'}</span>,
  },
  {
    key: 'factor_conversion', label: 'Factor', align: 'right',
    render: (v) => <span className="text-xs font-semibold text-content-secondary">{v ? `×${parseFloat(v)}` : '—'}</span>,
  },
  {
    key: 'precio_unitario', label: 'Precio Unit.', align: 'right',
    render: (v) => <span className="text-xs font-semibold text-content-secondary">{v ? fmt(v) : '—'}</span>,
  },
  {
    key: 'precio_con_iva', label: 'Precio + IVA', align: 'right',
    render: (v) => <span className="text-xs font-semibold text-content-secondary">{v ? fmt(v) : '—'}</span>,
  },
  {
    key: 'disponible', label: 'Estado', align: 'center',
    render: (v) => Number(v) === 1
      ? <StatusBadge tone="success" label="Activo" icon={Check} dot={false} size="sm" />
      : <StatusBadge tone="danger" label="Inactivo" icon={XIcon} dot={false} size="sm" />,
  },
];

const SuministroTab = ({ proveedores = [], stockPorBodega = [] }) => {
  const proveedoresRows = useMemo(
    () => proveedores.map((p, idx) => ({ ...p, id: p.id_item_proveedor || idx })),
    [proveedores],
  );

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
          <div className="border border-border-base rounded-xl overflow-hidden">
            <ErpTable columns={PROVEEDORES_COLUMNS} data={proveedoresRows} borderless />
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
