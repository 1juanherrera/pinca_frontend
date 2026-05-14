import {
  Package, Building2, Award, Boxes, DollarSign,
  TrendingUp, Network, AlertTriangle,
} from 'lucide-react';
import DetailDrawer from '../../../shared/DetailDrawer';
import StatusBadge from '../../../shared/StatusBadge';
import EmptyState from '../../../shared/EmptyState';
import IconBox from '../../../shared/IconBox';
import { fmt } from '../../../utils/formatters';

const TIPO_LABEL = { 1: 'Materia Prima', 2: 'Insumo' };
const TIPO_TONE  = { 1: 'warning', 2: 'neutral' };

const fmtCOP = (v) => v == null ? '—' : fmt(v);
const fmtNum = (v, dec = 2) =>
  Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec });

const StatTile = ({ icon: Icon, tone = 'neutral', label, value, sub }) => (
  <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border-subtle bg-surface-base">
    <IconBox icon={Icon} tone={tone} variant="subtle" size="sm" />
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
        {label}
      </p>
      <p className="text-sm font-bold text-content-primary tabular-nums truncate">
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-content-muted truncate">{sub}</p>
      )}
    </div>
  </div>
);

const MaestroDetailDrawer = ({ item, onClose }) => {
  if (!item) return null;

  const proveedores = item.proveedores ?? [];
  const sortedProv  = [...proveedores].sort((a, b) => {
    if (a.precio_kg == null) return 1;
    if (b.precio_kg == null) return -1;
    return a.precio_kg - b.precio_kg;
  });
  const mejorPrecioKg = sortedProv[0]?.precio_kg ?? null;

  return (
    <DetailDrawer
      isOpen
      onClose={onClose}
      icon={Package}
      title={item.nombre}
      subtitle={item.codigo ? `${item.codigo} · ${item.categoria_nombre ?? 'Sin categoría'}` : (item.categoria_nombre ?? '')}
      width="lg"
      bodyClassName="p-5 space-y-5"
    >
      {/* Header con tipo + métricas clave */}
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge
          tone={TIPO_TONE[item.tipo] ?? 'neutral'}
          label={TIPO_LABEL[item.tipo] ?? '—'}
          dot={false} size="sm"
        />
        {item.proveedores_count === 0 && (
          <StatusBadge tone="danger"  label="Sin proveedor" dot size="sm" />
        )}
        {item.proveedores_count === 1 && (
          <StatusBadge tone="warning" label="1 solo proveedor" dot size="sm" />
        )}
        {item.proveedores_count >= 2 && (
          <StatusBadge tone="success" label="Diversificada" dot size="sm" />
        )}
        {item.spread_pct > 20 && (
          <StatusBadge
            tone="warning"
            label={`Spread +${item.spread_pct}%`}
            icon={TrendingUp}
            dot={false} size="sm"
          />
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatTile
          icon={Boxes} tone="info"
          label="Stock total"
          value={item.stock_total > 0 ? `${fmtNum(item.stock_total)} kg` : 'Sin stock'}
        />
        <StatTile
          icon={DollarSign} tone="brand"
          label="Costo unit. actual"
          value={fmtCOP(item.costo_unitario)}
          sub="promedio ponderado"
        />
        <StatTile
          icon={Network} tone={item.proveedores_count >= 2 ? 'success' : item.proveedores_count === 1 ? 'warning' : 'danger'}
          label="Proveedores activos"
          value={item.proveedores_count}
        />
        <StatTile
          icon={Award} tone="success"
          label="Mejor precio/kg"
          value={mejorPrecioKg != null ? `${fmtCOP(mejorPrecioKg)}/kg` : '—'}
        />
      </div>

      {/* Tabla de proveedores */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-content-primary">
            Proveedores vinculados
          </h3>
          {sortedProv.length > 0 && (
            <span className="text-[10px] text-content-tertiary">
              ordenados por mejor $/kg
            </span>
          )}
        </div>

        {sortedProv.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            size="sm"
            title="Sin proveedores activos"
            description="Esta materia prima no tiene proveedores activos vinculados. Considerá vincular uno desde el módulo Proveedores."
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-border-base">
            <table className="w-full text-xs">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
                    Precio compra
                  </th>
                  <th className="px-3 py-2 text-center text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
                    Unidad
                  </th>
                  <th className="px-3 py-2 text-right text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
                    $/kg
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-surface-base">
                {sortedProv.map((p, idx) => {
                  const esMejor = idx === 0 && p.precio_kg != null;
                  return (
                    <tr
                      key={p.id_item_proveedor}
                      className={esMejor ? 'bg-semantic-success-subtle/30' : ''}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 size={12} className="text-content-muted shrink-0" />
                          <span className="font-medium text-content-primary truncate">
                            {p.nombre_empresa}
                          </span>
                          {esMejor && (
                            <StatusBadge tone="success" label="Mejor" icon={Award} dot={false} size="sm" />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-content-primary">
                        {fmtCOP(p.precio_unitario)}
                      </td>
                      <td className="px-3 py-2.5 text-center text-content-tertiary">
                        {p.unidad_compra_nombre ?? 'UND'}
                        {p.factor_conversion > 0 && p.factor_conversion !== 1 && (
                          <span className="text-content-muted ml-1">×{p.factor_conversion}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={`font-mono tabular-nums font-semibold ${esMejor ? 'text-semantic-success-fg' : 'text-content-primary'}`}>
                          {p.precio_kg != null ? fmtCOP(p.precio_kg) : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Comparativa entre mejor y peor si hay 2+ */}
        {sortedProv.length >= 2 && item.spread_pct > 0 && (
          <div className="mt-3 px-3 py-2.5 rounded-lg bg-semantic-warning-subtle/40 border border-semantic-warning/20">
            <p className="text-[11px] text-semantic-warning-fg leading-relaxed">
              <strong>Diferencia entre mejor y peor:</strong>{' '}
              {fmtCOP((item.precio_max_kg ?? 0) - (item.precio_min_kg ?? 0))}/kg
              {' '}({item.spread_pct}%). Cambiar al mejor proveedor podría ahorrar
              {' '}<strong>{fmtCOP(((item.costo_unitario ?? 0) - (item.precio_min_kg ?? 0)) * (item.stock_total ?? 0))}</strong>
              {' '}sobre el stock actual.
            </p>
          </div>
        )}
      </div>
    </DetailDrawer>
  );
};

export default MaestroDetailDrawer;
