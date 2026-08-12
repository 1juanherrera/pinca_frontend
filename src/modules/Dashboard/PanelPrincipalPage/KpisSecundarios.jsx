import { Factory, FileWarning, GitMerge, TrendingUp } from 'lucide-react';
import FlowCard from '../../../shared/FlowCard';
import { fmtNum, fmtCOPCompact, fmtPct } from './helpers';

// ─── FILA 2 — KPIs secundarios ──────────────────────────────────────────────
export const KpisSecundarios = ({
  navigate, produccion_curso, cotizaciones, sincronizacion, rentabilidad,
  margenObjetivoPct, margenMinimoPct,
}) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <FlowCard
      icon={Factory} tone="brand"
      label="Producción en curso"
      value={produccion_curso?.total ?? 0}
      sub={`${fmtNum(produccion_curso?.volumen_kg, 0)} kg`}
      onClick={() => navigate('/produccion')}
    />
    <FlowCard
      icon={FileWarning} tone="warning"
      label="Cotizaciones abiertas"
      value={cotizaciones?.total ?? 0}
      sub={fmtCOPCompact(cotizaciones?.valor_total)}
      onClick={() => navigate('/comercial')}
    />
    <FlowCard
      icon={GitMerge} tone="info"
      label="Items pendientes"
      value={sincronizacion?.items_proveedor_pendientes ?? 0}
      sub="por vincular"
      onClick={() => navigate('/sincronizacion')}
    />
    <FlowCard
      icon={TrendingUp}
      tone={
        rentabilidad?.margen_pct == null ? 'neutral'             // sin datos: no pintar rojo (falsa alarma)
          : rentabilidad.margen_pct >= margenObjetivoPct ? 'success'
          : rentabilidad.margen_pct >= margenMinimoPct ? 'warning'
          : 'danger'
      }
      label="Margen del mes"
      value={fmtPct(rentabilidad?.margen_pct)}
      sub={`Util. ${fmtCOPCompact(rentabilidad?.utilidad)}`}
    />
  </div>
);

export default KpisSecundarios;
