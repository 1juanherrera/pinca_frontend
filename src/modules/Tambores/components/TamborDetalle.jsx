import { ArrowDownCircle, ArrowUpCircle, Package } from 'lucide-react';
import { useTamborDetalle } from '../api/useTambores';
import { ESTADO_TAMBOR } from '../TamboresPage';

const TamborDetalle = ({ tamborId }) => {
  const { data, isLoading } = useTamborDetalle(tamborId);
  const tambor = data?.data ?? data;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 rounded-lg bg-zinc-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!tambor) return <p className="text-sm text-zinc-400">Sin datos.</p>;

  const estado = ESTADO_TAMBOR[tambor.estado] ?? ESTADO_TAMBOR[0];
  const pct = tambor.cantidad_inicial > 0
    ? Math.round((tambor.cantidad_actual / tambor.cantidad_inicial) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Nº Tambor" value={tambor.numero_tambor} />
        <Stat label="Material" value={tambor.material} />
        <Stat label="Bodega" value={tambor.bodega} />
        <Stat label="Ingreso" value={tambor.fecha_ingreso} />
        <div className="col-span-2 flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
          <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-semibold uppercase ${estado.bg} ${estado.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
            {estado.label}
          </span>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>{tambor.cantidad_actual} / {tambor.cantidad_inicial}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-400' : 'bg-red-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Historial */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase mb-2">Historial de movimientos</p>
        {tambor.movimientos?.length === 0 && (
          <div className="flex flex-col items-center py-8 text-zinc-400 gap-2">
            <Package size={24} />
            <p className="text-xs">Sin movimientos registrados</p>
          </div>
        )}
        <ul className="space-y-2">
          {(tambor.movimientos ?? []).map((m) => (
            <li key={m.id_tambor_movimiento} className="flex items-start gap-3 p-3 rounded-lg border border-zinc-100 bg-white">
              {m.tipo === 1
                ? <ArrowDownCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                : <ArrowUpCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-zinc-700">
                    {m.tipo === 1 ? 'Entrada' : 'Consumo'}
                    {m.referencia_tipo ? ` — ${m.referencia_tipo}` : ''}
                    {m.referencia_id ? ` #${m.referencia_id}` : ''}
                  </span>
                  <span className={`text-xs font-bold ${m.tipo === 1 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {m.tipo === 1 ? '+' : '-'}{m.cantidad}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">{m.fecha}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-semibold text-zinc-400 uppercase">{label}</span>
    <span className="text-sm font-medium text-zinc-800">{value ?? '—'}</span>
  </div>
);

export default TamborDetalle;
