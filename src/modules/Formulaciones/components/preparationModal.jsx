import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Stamp, FlaskConical, TrendingUp, Package, ArrowRight, Layers,
  CheckCircle2, ChevronRight, Boxes, Split,
} from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import { formatCOP, parseCOP } from '../utils/handlers';
import { Button } from '../../../shared/Button';
import { DEFAULT_UNITS, UNIT_CONFIG } from './preparationModal/constants';
import { calcularCantidad, calcularCombinacion, esEntero, formatCantidad } from './preparationModal/calculos';
import { SuccessView } from './preparationModal/PreparationSubComponents';
import { ConfirmSubForm } from './preparationModal/ConfirmSubForm';
import { CombinacionForm } from './preparationModal/CombinacionForm';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

// ─── Modal principal ──────────────────────────────────────────────────────────
export const PreparationModal = ({ unidades = DEFAULT_UNITS }) => {
  const activeDrawer = useBoundStore(state => state.activeDrawer);
  const payload      = useBoundStore(state => state.drawerPayload);
  const closeDrawer  = useBoundStore(state => state.closeDrawer);

  const [selectedUnit,    setSelectedUnit]    = useState(null);
  const [showForm,        setShowForm]        = useState(false);
  const [modo,            setModo]            = useState(null); // 'single' | 'combinacion'
  const [preparaciones,   setPreparaciones]   = useState(null);
  const [escalaOverrides, setEscalaOverrides] = useState({});
  const panelRef = useRef(null);

  const isOpen = activeDrawer === 'PREPARATION_FORM';

  const productDetail    = payload?.productDetail;
  const recalculatedData = payload?.recalculatedData;
  const totalUnificadoMP = payload?.totalUnificadoMP ?? null;  // Total MP con precios de proveedor seleccionados
  const item             = productDetail?.item;
  const costos           = productDetail?.costos;

  const effectiveUnidades = useMemo(() =>
    unidades.map(u => {
      const override = escalaOverrides[u.id_unidad];
      return override != null ? { ...u, escala: String(override) } : u;
    }),
    [unidades, escalaOverrides]
  );

  const volumen = useMemo(() =>
    recalculatedData?.item?.volumen_nuevo ?? productDetail?.item?.volumen_base ?? 0,
    [recalculatedData, productDetail]
  );

  const precioGalon = useMemo(() => parseCOP(recalculatedData?.recalculados?.precio_venta ?? costos?.precio_venta), [recalculatedData, costos]);
  // Si el usuario seleccionó proveedores en la tabla, usar totalUnificadoMP / volumen
  // como costo por galón (refleja precios de proveedor reales).
  // De lo contrario, usar el costo calculado por el backend (promedio ponderado de capas).
  const costoGalon  = useMemo(() => {
    if (totalUnificadoMP != null && volumen > 0) {
      return totalUnificadoMP / volumen;
    }
    return parseCOP(recalculatedData?.recalculados?.total ?? costos?.total);
  }, [totalUnificadoMP, volumen, recalculatedData, costos]);

  const rows = useMemo(() =>
    effectiveUnidades.map(u => {
      const escala   = parseFloat(u.escala);
      const cantidad = calcularCantidad(volumen, escala);
      return { ...u, escala, cantidad, costo: costoGalon * escala, precio: precioGalon * escala, esEntero: esEntero(cantidad) };
    }),
    [effectiveUnidades, volumen, costoGalon, precioGalon]
  );

  const combinacionSugerida = useMemo(() =>
    selectedUnit ? calcularCombinacion(volumen, effectiveUnidades) : [],
    [selectedUnit, volumen, effectiveUnidades]
  );

  const tieneResiduo = useMemo(() => {
    if (!selectedUnit) return false;
    const esc = escalaOverrides[selectedUnit.id_unidad] ?? parseFloat(selectedUnit.escala);
    return !esEntero(calcularCantidad(volumen, esc));
  }, [selectedUnit, volumen, escalaOverrides]);

  const formulaciones = recalculatedData?.formulaciones ?? productDetail?.formulaciones ?? [];

  const handleClose = () => {
    closeDrawer();
    setTimeout(() => { setSelectedUnit(null); setShowForm(false); setModo(null); setPreparaciones(null); setEscalaOverrides({}); }, 250);
  };

  const handleSelectUnit = (u) => {
    const esc = escalaOverrides[u.id_unidad];
    setSelectedUnit(esc != null ? { ...u, escala: String(esc) } : u);
    setShowForm(false);
    setModo(null);
  };
  const handleSuccess       = (data) => { setPreparaciones(Array.isArray(data) ? data : [data]); setShowForm(false); };

  // Escape cierra + scroll lock (mismo comportamiento que Modal/Drawer shared)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Autofocus al abrir + focus-trap (Tab/Shift+Tab) + restauración de foco al cerrar
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const node = panelRef.current;
    const getFocusable = () =>
      node
        ? Array.from(node.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
            (el) => el.offsetParent !== null || el === document.activeElement
          )
        : [];

    const focusables = getFocusable();
    if (focusables.length > 0) focusables[0].focus();
    else node?.focus();

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (items.length === 0) { e.preventDefault(); node?.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey) {
        if (active === first || !node?.contains(active)) { e.preventDefault(); last.focus(); }
      } else if (active === last || !node?.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    node?.addEventListener('keydown', onKeyDown);
    return () => {
      node?.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const titulo = preparaciones
    ? preparaciones.length > 1 ? 'Órdenes creadas' : 'Orden creada'
    : showForm && modo === 'combinacion' ? 'Confirmar preparaciones'
    : showForm ? 'Confirmar preparación'
    : 'Preparación por unidades';

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-surface-overlay backdrop-blur-sm" role="dialog" aria-modal="true">
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full max-w-7xl bg-surface-base rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-content-primary flex items-center justify-center shadow-md shadow-content-primary/20">
              <Stamp size={18} className="text-content-inverse" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-content-primary tracking-tight leading-none">{titulo}</h2>
              <p className="text-xs text-content-muted font-medium mt-0.5">{item?.nombre ?? '—'}</p>
            </div>
          </div>
          <button onClick={handleClose} aria-label="Cerrar" className="p-2 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-xl transition-all active:scale-95">
            <X size={18} />
          </button>
        </div>

        {/* Éxito */}
        {preparaciones && <SuccessView preparaciones={preparaciones} onClose={handleClose} />}

        {/* Form: una sola unidad */}
        {!preparaciones && showForm && modo === 'single' && selectedUnit && (
          <ConfirmSubForm
            unidad={selectedUnit} item={item} volumen={volumen} formulaciones={formulaciones}
            onBack={() => { setShowForm(false); setModo(null); }}
            onSuccess={handleSuccess}
          />
        )}

        {/* Form: combinación */}
        {!preparaciones && showForm && modo === 'combinacion' && selectedUnit && (
          <CombinacionForm
            unidadPrincipal={selectedUnit} unidades={effectiveUnidades}
            item={item} volumen={volumen} formulaciones={formulaciones}
            combinacionSugerida={combinacionSugerida}
            onBack={() => { setShowForm(false); setModo(null); }}
            onSuccess={handleSuccess}
          />
        )}

        {/* Tabla de unidades */}
        {!preparaciones && !showForm && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-4 gap-3 px-6 py-4 border-b border-border-subtle bg-surface-subtle/50 shrink-0">
              <div className="bg-surface-base border border-border-base rounded-xl px-3 py-3 shadow-sm">
                <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest mb-1 flex items-center gap-1"><Boxes size={9} /> Volumen</p>
                <p className="text-sm font-semibold text-content-primary tabular-nums">{volumen} <span className="text-[10px] font-normal text-content-muted">gal</span></p>
              </div>
              <div className="bg-surface-base border border-border-base rounded-xl px-3 py-3 shadow-sm">
                <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest mb-1 flex items-center gap-1"><FlaskConical size={9} /> Costo / Gal</p>
                <p className="text-sm font-semibold text-content-primary tabular-nums">{formatCOP(costoGalon)}</p>
              </div>
              <div className="bg-semantic-success-subtle border border-semantic-success/15 rounded-xl px-3 py-3 shadow-sm">
                <p className="text-[9px] font-bold text-semantic-success uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={9} /> Venta / Gal</p>
                <p className="text-sm font-semibold text-semantic-success-fg tabular-nums">{formatCOP(precioGalon)}</p>
              </div>
              <div className="bg-content-primary border border-content-primary rounded-xl px-3 py-3 shadow-sm">
                <p className="text-[9px] font-bold text-content-inverse/60 uppercase tracking-widest mb-1 flex items-center gap-1"><Layers size={9} className="text-content-inverse/60" /> Markup</p>
                <p className="text-sm font-semibold text-content-inverse tabular-nums">{costos?.porcentaje_utilidad ?? 0}%</p>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5">
              <p className="text-[10px] font-semibold text-content-muted uppercase flex items-center gap-2 mb-3">
                <span className="w-1 h-1 rounded-full bg-surface-strong" />
                {selectedUnit ? <><span className="text-content-secondary">{selectedUnit.nombre}</span> seleccionado</> : 'Selecciona la presentación principal a producir'}
              </p>
              <div className="space-y-2">
                {rows.map((u) => {
                  const cfg      = UNIT_CONFIG[u.nombre] ?? { icon: Package, color: 'text-content-secondary', bg: 'bg-surface-muted', border: 'border-border-base', ring: 'ring-border-strong' };
                  const selected = selectedUnit?.id_unidad === u.id_unidad;
                  return (
                    <button
                      key={u.id_unidad}
                      onClick={() => handleSelectUnit(u)}
                      className={`w-full text-left flex items-center gap-3 bg-surface-base border rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all active:scale-[0.99]
                        ${selected ? `ring-2 ${cfg.ring} ${cfg.border} shadow-md` : `${cfg.border} hover:border-border-strong`}`}
                    >
                      <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                        <cfg.icon size={16} className={cfg.color} />
                      </div>
                      <div className="w-28 shrink-0">
                        <p className={`text-xs font-semibold uppercase tracking-tight leading-none ${cfg.color}`}>{u.nombre}</p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          <input
                            type="number"
                            value={escalaOverrides[u.id_unidad] ?? parseFloat(unidades.find(o => o.id_unidad === u.id_unidad)?.escala ?? u.escala)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val > 0) setEscalaOverrides(prev => ({ ...prev, [u.id_unidad]: val }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            step="any"
                            min="0.001"
                            className="w-12 text-[10px] text-content-secondary font-medium bg-surface-muted border border-border-base rounded px-1 py-0.5 tabular-nums text-center focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
                          />
                          <span className="text-[10px] text-content-muted font-medium">gal</span>
                        </div>
                      </div>
                      <div className={`flex-1 flex items-center gap-1.5 ${cfg.bg} rounded-lg px-3 py-1.5`}>
                        <Boxes size={11} className={cfg.color} />
                        <span className={`text-sm font-bold tabular-nums ${cfg.color}`}>{formatCantidad(u.cantidad)}</span>
                        <span className="text-[10px] text-content-muted font-medium">envases</span>
                        {!u.esEntero && (
                          <span className="ml-auto text-[9px] font-bold text-semantic-warning bg-semantic-warning-subtle border border-semantic-warning/15 px-1.5 py-0.5 rounded-md">residuo</span>
                        )}
                      </div>
                      <ArrowRight size={11} className="text-content-muted shrink-0" />
                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest leading-none mb-0.5">Costo</p>
                        <p className="text-xs font-semibold text-content-secondary tabular-nums">{formatCOP(u.costo)}</p>
                      </div>
                      <ArrowRight size={11} className="text-content-muted shrink-0" />
                      <div className="text-right shrink-0">
                        <p className="text-[9px] font-bold text-semantic-success uppercase tracking-widest leading-none mb-0.5">Venta</p>
                        <p className="text-sm font-semibold text-semantic-success-fg tabular-nums">{formatCOP(u.precio)}</p>
                      </div>
                      <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all ${selected ? `${cfg.bg} ${cfg.color}` : 'bg-surface-muted'}`}>
                        {selected && <CheckCircle2 size={14} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 bg-surface-subtle border-t border-border-subtle shrink-0">
              <div className="flex items-center gap-1.5">
                <Package size={12} className="text-content-muted" />
                <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider">
                  {unidades.length} presentaciones · {volumen} gal
                </span>
              </div>
              <div className="flex items-center gap-2">
                {selectedUnit && tieneResiduo && (
                  <button
                    onClick={() => { setShowForm(true); setModo('combinacion'); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-semantic-info-fg bg-semantic-info-subtle border border-semantic-info/20 rounded-xl hover:bg-semantic-info-subtle transition-all active:scale-[0.98]"
                  >
                    <Split size={13} /> Preparar con segunda unidad
                  </button>
                )}
                <Button
                  onClick={() => { setShowForm(true); setModo('single'); }}
                  variant="emerald"
                  disabled={!selectedUnit}
                >
                  <ChevronRight size={14} />
                  {tieneResiduo ? 'Preparar solo esta unidad' : 'Preparar'}
                </Button>
                <Button onClick={handleClose} variant="black">Cerrar</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};
