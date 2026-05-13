import {
  Layers, Check, X, Link2,
  AlertTriangle, Network, Copy, TrendingDown,
} from 'lucide-react';
import FlowCard from '../../../shared/FlowCard';
import ProgressPill from '../../../shared/ProgressPill';
import { fmt } from '../../../utils/formatters';
import { useSincStats } from '../api/useSincronizacion';

const formatCOP = (v) => {
  if (v == null || v === 0) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
  return fmt(v);
};

const SkeletonGrid = () => (
  <div className="flex flex-col gap-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-surface-muted animate-pulse" />
      ))}
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-surface-muted animate-pulse" />
      ))}
    </div>
    <div className="h-32 rounded-xl bg-surface-muted animate-pulse" />
  </div>
);

const DashboardTab = () => {
  const { data, isLoading } = useSincStats();

  if (isLoading || !data) return <SkeletonGrid />;

  const total = data.total_mp || 0;
  const pctConProveedor = total > 0 ? (data.mp_con_proveedor / total) * 100 : 0;
  const pctDiversificadas = total > 0 ? (data.mp_dos_o_mas_proveedores / total) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Fila 1 — cobertura general */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FlowCard icon={Layers} tone="info"    label="Total MP"      value={data.total_mp ?? 0} />
        <FlowCard icon={Check}  tone="success" label="Con proveedor" value={data.mp_con_proveedor ?? 0} />
        <FlowCard icon={X}      tone="warning" label="Sin proveedor" value={data.mp_sin_proveedor ?? 0} />
        <FlowCard icon={Link2}  tone="danger"  label="Pendientes"    value={data.items_proveedor_pendientes ?? 0} sub="por vincular" />
      </div>

      {/* Fila 2 — distribución y oportunidades */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <FlowCard
          icon={AlertTriangle} tone="warning"
          label="1 solo proveedor"  value={data.mp_un_solo_proveedor ?? 0}
          sub="riesgo concentración"
        />
        <FlowCard
          icon={Network} tone="success"
          label="2+ proveedores"    value={data.mp_dos_o_mas_proveedores ?? 0}
          sub="diversificado"
        />
        <FlowCard
          icon={Copy} tone="info"
          label="Duplicados"        value={data.duplicados_potenciales ?? 0}
          sub="pendientes depurar"
        />
        <FlowCard
          icon={TrendingDown} tone="brand"
          label="Ahorro potencial"  value={formatCOP(data.ahorro_potencial)}
          sub="cambiar a mejor prov."
        />
      </div>

      {/* Cobertura */}
      <div className="bg-surface-base border border-border-base rounded-xl p-4 space-y-3 shadow-card">
        <h3 className="text-sm font-semibold text-content-primary">
          Cobertura del catálogo
        </h3>
        <ProgressPill
          value={pctConProveedor}
          label={`MP con al menos 1 proveedor (${data.mp_con_proveedor}/${total})`}
          tone="success"
        />
        <ProgressPill
          value={pctDiversificadas}
          label={`MP con 2+ proveedores — diversificadas (${data.mp_dos_o_mas_proveedores}/${total})`}
          tone="info"
        />
      </div>
    </div>
  );
};

export default DashboardTab;
