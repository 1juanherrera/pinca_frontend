import { Calendar } from 'lucide-react';

const PERIODOS = [
  { id: 'mes',       label: 'Este mes'     },
  { id: 'trimestre', label: 'Trimestre'    },
  { id: 'anio',      label: 'Este año'     },
  { id: 'custom',    label: 'Personalizado'},
];

/** Devuelve { desde, hasta } para un período predefinido */
export const getDateRange = (periodoId) => {
  const hoy    = new Date();
  const pad    = (n) => String(n).padStart(2, '0');
  const toStr  = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  switch (periodoId) {
    case 'mes': {
      const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      return { desde: toStr(desde), hasta: toStr(hoy) };
    }
    case 'trimestre': {
      const q     = Math.floor(hoy.getMonth() / 3);
      const desde = new Date(hoy.getFullYear(), q * 3, 1);
      return { desde: toStr(desde), hasta: toStr(hoy) };
    }
    case 'anio': {
      const desde = new Date(hoy.getFullYear(), 0, 1);
      return { desde: toStr(desde), hasta: toStr(hoy) };
    }
    default:
      return { desde: toStr(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: toStr(hoy) };
  }
};

const CostosFilters = ({ periodo, desde, hasta, onPeriodo, onDesde, onHasta }) => (
  <div className="bg-white border border-zinc-200/70 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
    <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
      <Calendar className="w-3.5 h-3.5" />
      Período:
    </div>

    {/* Botones de período predefinido */}
    <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-0.5">
      {PERIODOS.map((p) => (
        <button
          key={p.id}
          onClick={() => onPeriodo(p.id)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            periodo === p.id
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>

    {/* Inputs de fecha personalizados */}
    {periodo === 'custom' && (
      <div className="flex items-center gap-2 ml-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-400">Desde</span>
          <input
            type="date"
            value={desde}
            onChange={(e) => onDesde(e.target.value)}
            className="text-xs border border-zinc-200 rounded-lg px-2 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-400">Hasta</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => onHasta(e.target.value)}
            className="text-xs border border-zinc-200 rounded-lg px-2 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
      </div>
    )}

    {periodo !== 'custom' && (
      <span className="text-xs text-zinc-400 ml-1">
        {desde} → {hasta}
      </span>
    )}
  </div>
);

export default CostosFilters;
