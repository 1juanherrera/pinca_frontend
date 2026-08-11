// ─── Fila de materia prima ────────────────────────────────────────────────────
const MateriaPrimaRow = ({ item, index }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-border-subtle last:border-0">
    <div className="w-6 h-6 rounded-lg bg-surface-muted flex items-center justify-center shrink-0">
      <span className="text-[9px] font-bold text-content-muted">{String(index + 1).padStart(2, '0')}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-content-primary leading-none truncate">{item.nombre}</p>
      <p className="text-[10px] text-content-muted  mt-0.5">{item.codigo}</p>
    </div>
    <div className="text-right shrink-0">
      <p className="text-xs font-bold text-content-primary tabular-nums">
        {typeof item.cantidad === 'number' ? item.cantidad.toFixed(3) : item.cantidad}
      </p>
      <p className="text-[9px] text-content-muted">{item.porcentajes ? `${parseFloat(item.porcentajes).toFixed(2)}%` : '—'}</p>
    </div>
  </div>
);

export default MateriaPrimaRow;
