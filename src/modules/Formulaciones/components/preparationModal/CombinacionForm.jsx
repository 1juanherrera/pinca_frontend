import { useMemo, useState } from 'react';
import {
  Package, AlertCircle, ClipboardList, Loader2, CheckCircle2,
  Sparkles, Split,
} from 'lucide-react';
import { usePreparaciones } from '../../api/usePreparaciones';
import DisponibilidadModal from '../../../Produccion/components/DisponibilidadModal';
import { useCrearRequisiciones } from '../../../Produccion/api/useRequisiciones';
import { UNIT_CONFIG } from './constants';
import { round5, escalarFormulaciones } from './calculos';
import { MetaForm, IndirectCostSelector, OrdenCard } from './PreparationSubComponents';

// ─── Sub-formulario: preparación con segunda unidad ───────────────────────────
// Muestra siempre la combinación sugerida Y permite elegir manualmente la 2ª unidad
export const CombinacionForm = ({
  unidadPrincipal, unidades, item, volumen, formulaciones = [],
  combinacionSugerida, onBack, onSuccess,
}) => {
  const [observaciones,      setObservaciones]      = useState('');
  const [fechaInicio,        setFechaInicio]        = useState('');
  const [fechaFin,           setFechaFin]           = useState('');
  const [error,              setError]              = useState(null);
  const [creando,            setCreando]            = useState(false);
  const [modoSegunda,        setModoSegunda]        = useState('sugerida');
  const [segundaUnidad,      setSegundaUnidad]      = useState(null);
  const [selectedCostos,     setSelectedCostos]     = useState([]);
  const [showDisponibilidad, setShowDisponibilidad] = useState(false);

  const { createAsync }    = usePreparaciones(null, item?.id);
  const crearRequisiciones = useCrearRequisiciones();

  const escalaPrincipal  = parseFloat(unidadPrincipal.escala);
  const envasesPrincipales = Math.floor(round5(volumen / escalaPrincipal));
  const volumenPrincipal = round5(envasesPrincipales * escalaPrincipal);
  const volumenResiduo   = round5(volumen - volumenPrincipal);

  // Unidades válidas para el residuo: escala < escala principal, y residuo / escala >= 1 entero
  const unidadesParaResiduo = unidades
    .filter(u => {
      const e = parseFloat(u.escala);
      return e < escalaPrincipal && u.id_unidad !== unidadPrincipal.id_unidad;
    })
    .sort((a, b) => parseFloat(b.escala) - parseFloat(a.escala));

  // Combinación activa según modo
  const ordenesActivas = useMemo(() => {
    if (modoSegunda === 'sugerida') return combinacionSugerida;
    if (!segundaUnidad) return null;
    const escalaSegunda = parseFloat(segundaUnidad.escala);
    const envasesSegunda = Math.floor(round5(volumenResiduo / escalaSegunda));
    if (envasesSegunda <= 0) return null;
    const volumenSegunda = round5(envasesSegunda * escalaSegunda);
    return [
      { unidad: unidadPrincipal, envases: envasesPrincipales, volumenCubierto: volumenPrincipal },
      { unidad: segundaUnidad,   envases: envasesSegunda,      volumenCubierto: volumenSegunda   },
    ];
  }, [modoSegunda, segundaUnidad, combinacionSugerida, unidadPrincipal, envasesPrincipales, volumenPrincipal, volumenResiduo]);

  const volumenCubierto = ordenesActivas
    ? ordenesActivas.reduce((s, o) => s + o.volumenCubierto, 0)
    : 0;
  const volumenSinCubrir = round5(volumen - volumenCubierto);

  const handleConfirmar = async ({ requisicionItems } = {}) => {
    if (!ordenesActivas) return;
    setShowDisponibilidad(false);
    setError(null);
    setCreando(true);
    const creadas = [];
    try {
      for (let idx = 0; idx < ordenesActivas.length; idx++) {
        const orden = ordenesActivas[idx];
        const detalle = escalarFormulaciones(formulaciones, orden.volumenCubierto, volumen);
        const data = await createAsync({
          item_general_id: item?.id,
          unidad_id:       orden.unidad.id_unidad,
          cantidad:        orden.volumenCubierto,
          fecha_inicio:    fechaInicio || null,
          fecha_fin:       fechaFin    || null,
          observaciones:   observaciones.trim() || null,
          detalle,
          // Mismo shape que el form simple (buildPayload): IndirectCostSelector produce
          // {nombre, categoria, valor_aplicado} — NO `costos_indirectos_id` (era undefined → no se guardaban).
          costos_indirectos: idx === 0 ? selectedCostos.map(c => ({
            nombre:         c.nombre,
            categoria:      c.categoria,
            valor_aplicado: c.valor_aplicado,
          })) : [],
        });
        creadas.push(data);
      }

      // Requisiciones vinculadas a la primera preparación creada
      if (requisicionItems?.length > 0 && creadas[0]) {
        const items = requisicionItems.map((r) => ({
          ...r, preparacion_id: creadas[0].id_preparaciones,
        }));
        await crearRequisiciones.mutateAsync(items);
      }

      onSuccess(creadas);
    } catch (err) {
      setError(err?.message ?? 'Error al crear las preparaciones');
    } finally {
      setCreando(false);
    }
  };

  const cfgPrincipal = UNIT_CONFIG[unidadPrincipal.nombre] ?? { icon: Package, color: 'text-content-secondary', bg: 'bg-surface-muted', border: 'border-border-base' };

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* Panel izquierdo ─────────────────────────────────────── */}
      <div className="w-[45%] shrink-0 border-r border-border-subtle flex flex-col overflow-y-auto">
        <div className="flex flex-col gap-4 px-5 py-5 flex-1">

          {/* Unidad principal */}
          <div className={`flex items-center gap-3 ${cfgPrincipal.bg} border ${cfgPrincipal.border} rounded-xl px-3 py-2.5`}>
            <div className={`w-8 h-8 rounded-lg border ${cfgPrincipal.border} flex items-center justify-center shrink-0`}>
              <cfgPrincipal.icon size={15} className={cfgPrincipal.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-black uppercase tracking-tight leading-none ${cfgPrincipal.color}`}>{unidadPrincipal.nombre}</p>
              <p className="text-[10px] text-content-muted mt-0.5">
                {envasesPrincipales} envases · {volumenPrincipal} gal
              </p>
            </div>
            <button onClick={onBack} className="text-[9px] font-bold text-content-muted hover:text-content-secondary underline underline-offset-2 shrink-0">Cambiar</button>
          </div>

          {/* Residuo info */}
          <div className="flex items-center gap-2 bg-semantic-warning-subtle border border-semantic-warning/15 rounded-xl px-3 py-2">
            <AlertCircle size={12} className="text-semantic-warning shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-semantic-warning-fg">Residuo: {volumenResiduo} gal</p>
              <p className="text-[9px] text-semantic-warning-fg">No caben en {unidadPrincipal.nombre}. Elige cómo manejarlo.</p>
            </div>
          </div>

          {/* Selector de modo para la segunda unidad */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold text-content-muted uppercase tracking-widest">Segunda unidad para el residuo</p>

            {/* Opción: sugerida */}
            <button
              onClick={() => setModoSegunda('sugerida')}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all
                ${modoSegunda === 'sugerida'
                  ? 'bg-semantic-success-subtle border-semantic-success/20 ring-1 ring-semantic-success/50'
                  : 'bg-surface-base border-border-base hover:border-border-strong'}`}
            >
              <Sparkles size={13} className={modoSegunda === 'sugerida' ? 'text-semantic-success' : 'text-content-muted'} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold leading-none ${modoSegunda === 'sugerida' ? 'text-semantic-success-fg' : 'text-content-secondary'}`}>
                  Combinación sugerida
                </p>
                <p className="text-[9px] text-content-muted mt-0.5">
                  {combinacionSugerida.length} orden{combinacionSugerida.length !== 1 ? 'es' : ''} · cubre el volumen exacto
                </p>
              </div>
              {modoSegunda === 'sugerida' && <CheckCircle2 size={14} className="text-semantic-success shrink-0" />}
            </button>

            {/* Opción: manual */}
            <button
              onClick={() => setModoSegunda('manual')}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all
                ${modoSegunda === 'manual'
                  ? 'bg-semantic-info-subtle border-semantic-info/20 ring-1 ring-semantic-info/30'
                  : 'bg-surface-base border-border-base hover:border-border-strong'}`}
            >
              <Split size={13} className={modoSegunda === 'manual' ? 'text-semantic-info' : 'text-content-muted'} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold leading-none ${modoSegunda === 'manual' ? 'text-semantic-info-fg' : 'text-content-secondary'}`}>
                  Elegir unidad manualmente
                </p>
                <p className="text-[9px] text-content-muted mt-0.5">Selecciona qué unidad usar para el residuo</p>
              </div>
              {modoSegunda === 'manual' && <CheckCircle2 size={14} className="text-semantic-info shrink-0" />}
            </button>

            {/* Grid de unidades para el residuo (modo manual) */}
            {modoSegunda === 'manual' && (
              <div className="flex flex-col gap-1.5 mt-1">
                {unidadesParaResiduo.map(u => {
                  const escala2     = parseFloat(u.escala);
                  const envases2    = Math.floor(round5(volumenResiduo / escala2));
                  const volumen2    = round5(envases2 * escala2);
                  const sobrante    = round5(volumenResiduo - volumen2);
                  const seleccionada = segundaUnidad?.id_unidad === u.id_unidad;
                  const cfg2 = UNIT_CONFIG[u.nombre] ?? { icon: Package, color: 'text-content-secondary', bg: 'bg-surface-muted', border: 'border-border-base', ring: 'ring-border-strong' };
                  if (envases2 <= 0) return null;
                  return (
                    <button
                      key={u.id_unidad}
                      onClick={() => setSegundaUnidad(u)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all
                        ${seleccionada
                          ? `${cfg2.bg} ${cfg2.border} ring-1 ${cfg2.ring}`
                          : 'bg-surface-base border-border-base hover:border-border-strong'}`}
                    >
                      <div className={`w-7 h-7 rounded-lg ${cfg2.bg} flex items-center justify-center shrink-0`}>
                        <cfg2.icon size={13} className={cfg2.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold leading-none ${cfg2.color}`}>{u.nombre}</p>
                        <p className="text-[9px] text-content-muted mt-0.5">
                          {envases2} envase{envases2 !== 1 ? 's' : ''} · {volumen2} gal
                          {sobrante > 0.001 && <span className="text-semantic-warning"> · {sobrante} gal sin cubrir</span>}
                        </p>
                      </div>
                      {seleccionada && <CheckCircle2 size={13} className={cfg2.color} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Aviso si queda volumen sin cubrir */}
          {volumenSinCubrir > 0.001 && ordenesActivas && (
            <div className="flex items-center gap-2 bg-semantic-warning-subtle border border-semantic-warning/15 rounded-xl px-3 py-2">
              <AlertCircle size={12} className="text-semantic-warning shrink-0" />
              <p className="text-[10px] text-semantic-warning-fg font-medium">
                {volumenSinCubrir} gal sin cubrir con esta combinación.
              </p>
            </div>
          )}

          <MetaForm
            fechaInicio={fechaInicio} setFechaInicio={setFechaInicio}
            fechaFin={fechaFin}       setFechaFin={setFechaFin}
            observaciones={observaciones} setObservaciones={setObservaciones}
            error={error}
          />
          <IndirectCostSelector selected={selectedCostos} onChange={setSelectedCostos} />
        </div>

        <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle shrink-0">
          <button
            onClick={() => setShowDisponibilidad(true)}
            disabled={creando || crearRequisiciones.isPending || !ordenesActivas || (modoSegunda === 'manual' && !segundaUnidad)}
            className="flex items-center justify-center gap-2 w-full bg-content-primary hover:bg-content-secondary disabled:opacity-40 disabled:cursor-not-allowed text-content-inverse rounded-xl py-3 text-xs font-bold tracking-wide transition-all active:scale-[0.98]"
          >
            {(creando || crearRequisiciones.isPending)
              ? <><Loader2 size={13} className="animate-spin" /> Creando órdenes…</>
              : <><ClipboardList size={13} /> Crear {ordenesActivas?.length ?? 2} preparaciones</>}
          </button>
        </div>
      </div>

      {showDisponibilidad && (
        <DisponibilidadModal
          itemGeneralId={item?.id}
          cantidad={volumen}
          unidadId={unidadPrincipal.id_unidad}
          preparacionId={null}
          onConfirmar={handleConfirmar}
          onClose={() => setShowDisponibilidad(false)}
        />
      )}

      {/* Panel derecho: resumen visual de las 2 órdenes ────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-content-primary shrink-0">
          <div className="flex items-center gap-2">
            <Split size={13} className="text-content-inverse/60" />
            <p className="text-[10px] font-black uppercase tracking-widest text-content-inverse/60">Resumen de órdenes</p>
          </div>
          <p className="text-[9px] font-bold text-content-inverse/60 uppercase tracking-widest">{volumen} gal totales</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {ordenesActivas ? (
            <>
              {/* Barra de distribución */}
              <div className="flex h-5 rounded-lg overflow-hidden gap-0.5">
                {ordenesActivas.map((o) => {
                  const pct = (o.volumenCubierto / volumen) * 100;
                  const cfg = UNIT_CONFIG[o.unidad.nombre] ?? { bg: 'bg-surface-strong' };
                  return (
                    <div
                      key={o.unidad.id_unidad}
                      className={`h-full ${cfg.bg} flex items-center justify-center`}
                      style={{ width: `${pct}%` }}
                    >
                      {pct > 10 && <span className="text-[9px] font-bold text-white/80">{Math.round(pct)}%</span>}
                    </div>
                  );
                })}
                {volumenSinCubrir > 0.001 && (
                  <div
                    className="h-full bg-semantic-warning/20 flex items-center justify-center"
                    style={{ width: `${(volumenSinCubrir / volumen) * 100}%` }}
                  >
                    <span className="text-[9px] font-bold text-semantic-warning-fg">sin cubrir</span>
                  </div>
                )}
              </div>

              {/* Cards de cada orden */}
              {ordenesActivas.map((o, i) => (
                <OrdenCard key={o.unidad.id_unidad} orden={o} index={i} volumenBase={volumen} />
              ))}

              {/* Materias primas de cada orden */}
              <div className="flex flex-col gap-3">
                {ordenesActivas.map((o, i) => {
                  const formulacionesEscaladas = escalarFormulaciones(formulaciones, o.volumenCubierto, volumen);
                  const cfg = UNIT_CONFIG[o.unidad.nombre] ?? { icon: Package, color: 'text-content-secondary', bg: 'bg-surface-muted', border: 'border-border-subtle' };
                  return (
                    <div key={o.unidad.id_unidad} className="bg-surface-base border border-border-subtle rounded-xl overflow-hidden">
                      <div className={`flex items-center gap-2 px-4 py-2 ${cfg.bg} border-b ${cfg.border}`}>
                        <span className="text-[9px] font-black text-content-muted">ORDEN {i + 1}</span>
                        <cfg.icon size={11} className={cfg.color} />
                        <span className={`text-xs font-bold ${cfg.color}`}>{o.envases} × {o.unidad.nombre}</span>
                        <span className="ml-auto text-[9px] text-content-muted">{o.volumenCubierto} gal</span>
                      </div>
                      {formulacionesEscaladas.slice(0, 4).map((mp, j) => (
                        <div key={j} className="flex items-center justify-between px-4 py-1.5 border-b border-border-subtle last:border-0">
                          <span className="text-[10px] text-content-secondary truncate max-w-[60%]">{mp.materia_prima_nombre ?? formulaciones[j]?.nombre ?? '—'}</span>
                          <span className="text-[10px]  font-bold text-content-secondary">{mp.cantidad.toFixed(3)}</span>
                        </div>
                      ))}
                      {formulaciones.length > 4 && (
                        <div className="px-4 py-1.5 text-[9px] text-content-muted">+{formulaciones.length - 4} ingredientes más</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
              <Split size={24} className="text-content-muted" />
              <p className="text-xs text-content-muted">
                {modoSegunda === 'manual' ? 'Selecciona una unidad para el residuo' : 'Cargando sugerencia…'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
