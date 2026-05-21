import { useEffect, useMemo, useState } from 'react';
import {
  GitBranch, Search, Hash, Truck, Calendar, Layers, History,
  AlertTriangle, ArrowRight,
} from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import EmptyState from '../../shared/EmptyState';
import IconBox from '../../shared/IconBox';
import StatusBadge from '../../shared/StatusBadge';
import { useBoundStore } from '../../store/useBoundStore';
import { useLotesAutocomplete } from './api/useTrazabilidad';
import {
  TrazabilidadPorLoteDrawer,
  TrazabilidadPorPreparacionDrawer,
} from './components/TrazabilidadDrawer';
import ExportTrazabilidad from './components/ExportTrazabilidad';
import { formatLetterDate } from '../../utils/formatters';

const fmtDate = (d) => {
  if (!d) return '—';
  try { return formatLetterDate(d.split(' ')[0] ?? d.split('T')[0]); } catch { return d; }
};

const TrazabilidadPage = () => {
  const setActiveTitle = useBoundStore((s) => s.setActiveTitle);
  useEffect(() => { setActiveTitle?.('Trazabilidad'); }, [setActiveTitle]);

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loteAbierto, setLoteAbierto] = useState(null);
  const [prepAbierta, setPrepAbierta] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: lotes = [], isLoading } = useLotesAutocomplete(debounced);

  const recientes = useMemo(() => lotes.slice(0, 30), [lotes]);

  return (
    <div className="relative flex flex-col w-full gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title="Trazabilidad de lotes"
          subtitle="Auditoría"
          description="Origen y destino de cada lote de materia prima usado en producción"
          icon={GitBranch}
          breadcrumbs={[
            { label: 'Inventario' },
            { label: 'Trazabilidad', path: '/trazabilidad' },
          ]}
        />
      </div>

      {/* Buscador */}
      <div className="bg-white border border-border-subtle rounded-2xl px-5 py-4 shadow-sm">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-content-muted mb-2">
          Buscar por código de lote del proveedor
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: LOT-2026-0123, batch-A77, FF441…"
            className="w-full pl-10 pr-3 py-2.5 text-sm bg-surface-subtle border border-border-base rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
        <p className="text-[11px] text-content-tertiary mt-2 leading-relaxed">
          Mostramos los lotes más recientes recibidos por OC. Tocá uno para ver sus ingresos y qué preparaciones lo consumieron.
          Si un proveedor reporta un defecto, ingresá su código de lote y revisá inmediatamente qué órdenes pueden estar afectadas.
        </p>
      </div>

      {/* Listado de lotes */}
      <div className="bg-white border border-border-subtle rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-border-subtle flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-content-muted flex items-center gap-1.5">
            <Layers size={11} /> {debounced ? `Resultados para "${debounced}"` : 'Lotes recientes'}
          </p>
          <span className="text-[11px] text-content-tertiary">{recientes.length} {recientes.length === 1 ? 'lote' : 'lotes'}</span>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-surface-muted animate-pulse" />
            ))}
          </div>
        ) : recientes.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={debounced ? AlertTriangle : History}
              title={debounced ? 'Sin coincidencias' : 'Sin lotes registrados'}
              description={
                debounced
                  ? `No encontramos ningún lote que contenga "${debounced}". Probá con otra parte del código.`
                  : 'Aún no hay lotes con código cargado. Los lotes aparecen al recibir OCs.'
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {recientes.map((l) => (
              <li key={l.lote}>
                <button
                  type="button"
                  onClick={() => setLoteAbierto(l.lote)}
                  className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-surface-subtle transition-colors group"
                >
                  <IconBox icon={Hash} tone="brand" variant="subtle" size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-content-primary truncate font-mono">{l.lote}</p>
                    <div className="flex items-center gap-3 flex-wrap text-[11px] text-content-tertiary mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Truck size={11} /> {l.capas} {l.capas === 1 ? 'ingreso' : 'ingresos'}
                      </span>
                      {l.ultima_recepcion && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={11} /> Última recepción {fmtDate(l.ultima_recepcion)}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge tone="info" label="Ver trazabilidad" icon={ArrowRight} dot={false} size="sm" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {loteAbierto && (
        <TrazabilidadPorLoteDrawer
          lote={loteAbierto}
          onClose={() => setLoteAbierto(null)}
        />
      )}
      {prepAbierta && (
        <TrazabilidadPorPreparacionDrawer
          preparacionId={prepAbierta}
          onClose={() => setPrepAbierta(null)}
        />
      )}

      <ExportTrazabilidad />
    </div>
  );
};

export default TrazabilidadPage;
