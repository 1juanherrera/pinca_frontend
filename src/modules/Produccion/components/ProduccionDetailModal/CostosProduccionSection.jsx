import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { fmtCOP } from './helpers';

// ─── Sección Costos reales vs teóricos (post-producción) ────────────────────
const CostosProduccionSection = ({ consumoCapas = [], detalle = [], costosIndirectos = [], cantidadEnvases }) => {
  // Agrupar consumo_capas por ingrediente y sumar
  const porItem = useMemo(() => {
    const map = new Map();
    for (const c of consumoCapas) {
      const id = c.item_general_id;
      if (!map.has(id)) map.set(id, { item_general_id: id, cantidad: 0, costoReal: 0 });
      const acc = map.get(id);
      acc.cantidad += Number(c.cantidad_consumida) || 0;
      acc.costoReal += Number(c.costo_total) || 0;
    }
    // Cruzar con detalle (que tiene nombre + costo teórico actual)
    return Array.from(map.values()).map((acc) => {
      const det = detalle.find((d) => d.item_general_id === acc.item_general_id) || {};
      const costoTeoricoUnit = Number(det.materia_prima_costo_unitario) || 0;
      const costoTeorico = acc.cantidad * costoTeoricoUnit;
      const delta = costoTeorico > 0 ? ((acc.costoReal - costoTeorico) / costoTeorico) * 100 : 0;
      return { ...acc, nombre: det.nombre, codigo: det.codigo, costoTeorico, delta, costoTeoricoUnit };
    }).sort((a, b) => b.costoReal - a.costoReal);
  }, [consumoCapas, detalle]);

  if (porItem.length === 0) {
    return (
      <p className="text-[10px] text-content-muted italic">
        Sin desglose de costo real disponible (preparación previa al sistema de lotes).
      </p>
    );
  }

  const totalReal      = porItem.reduce((s, r) => s + r.costoReal, 0);
  const totalTeorico   = porItem.reduce((s, r) => s + r.costoTeorico, 0);
  const ciTotal        = costosIndirectos.reduce((s, c) => s + Number(c.valor_aplicado || 0), 0);
  const totalConCI     = totalReal + ciTotal;
  const deltaTotalPct  = totalTeorico > 0 ? ((totalReal - totalTeorico) / totalTeorico) * 100 : 0;
  const costoEnvase    = cantidadEnvases > 0 ? totalConCI / cantidadEnvases : 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-lg border border-border-base bg-surface-base">
          <p className="text-[9px] uppercase tracking-wider text-content-tertiary">Costo real (MP + CI)</p>
          <p className="text-sm font-bold text-content-primary tabular-nums">{fmtCOP(totalConCI)}</p>
          <p className="text-[10px] text-content-tertiary">MP: {fmtCOP(totalReal)} · CI: {fmtCOP(ciTotal)}</p>
        </div>
        <div className="p-2.5 rounded-lg border border-border-base bg-surface-base">
          <p className="text-[9px] uppercase tracking-wider text-content-tertiary">Costo por envase</p>
          <p className="text-sm font-bold text-content-primary tabular-nums">{fmtCOP(costoEnvase)}</p>
          <p className="text-[10px] text-content-tertiary">{cantidadEnvases} envases producidos</p>
        </div>
      </div>

      {/* Variación vs teórico */}
      {Math.abs(deltaTotalPct) > 0.1 && (
        <div className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border ${
          deltaTotalPct >= 0
            ? 'border-semantic-danger/20 bg-semantic-danger-subtle text-semantic-danger-fg'
            : 'border-semantic-success/20 bg-semantic-success-subtle text-semantic-success-fg'
        }`}>
          {deltaTotalPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <p className="text-[10px] leading-snug">
            <strong>{deltaTotalPct >= 0 ? '+' : ''}{deltaTotalPct.toFixed(1)}%</strong> vs costo teórico actual
            (teórico: {fmtCOP(totalTeorico)}, real: {fmtCOP(totalReal)}).
            {' '}{deltaTotalPct >= 0 ? 'Costó más caro de lo estimado.' : 'Costó menos de lo estimado.'}
          </p>
        </div>
      )}

      {/* Desglose por ingrediente */}
      <div className="border border-border-subtle rounded-xl overflow-hidden">
        <div className="px-3 py-2 bg-surface-subtle border-b border-border-subtle flex items-center gap-1.5">
          <DollarSign size={10} className="text-content-tertiary" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-content-tertiary">Por ingrediente</span>
        </div>
        <div className="divide-y divide-border-subtle">
          {porItem.map((r) => (
            <div key={r.item_general_id} className="px-3 py-2 hover:bg-surface-subtle/50">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-content-primary truncate">{r.nombre ?? '—'}</p>
                  <p className="text-[10px] text-content-muted">{Number(r.cantidad).toFixed(3)} kg</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-content-primary tabular-nums">{fmtCOP(r.costoReal)}</p>
                  <p className="text-[10px] text-content-tertiary tabular-nums">teó: {fmtCOP(r.costoTeorico)}</p>
                </div>
              </div>
              {Math.abs(r.delta) > 0.5 && (
                <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  r.delta >= 0
                    ? 'text-semantic-danger-fg bg-semantic-danger-subtle'
                    : 'text-semantic-success-fg bg-semantic-success-subtle'
                }`}>
                  {r.delta >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                  {r.delta >= 0 ? '+' : ''}{r.delta.toFixed(1)}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CostosProduccionSection;
