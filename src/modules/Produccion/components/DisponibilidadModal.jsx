import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, ChevronUp, Loader2, ShoppingCart,
  Package, Building2, Phone, Mail, ClipboardList,
} from 'lucide-react';
import { useVerificarDisponibilidad, useCrearRequisiciones } from '../api/useRequisiciones';
import StatusBadge from '../../../shared/StatusBadge';

const fmtNum = (v) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(Number(v) || 0);

const fmtCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0);

// ── Badge de estado por material ──────────────────────────────────────────────
const EstadoChip = ({ tieneDeficit, deficit }) => {
  if (!tieneDeficit) {
    return <StatusBadge tone="success" label="Disponible" icon={CheckCircle2} dot={false} size="sm" fixedWidth />;
  }
  return <StatusBadge tone="danger" label={`Déficit ${fmtNum(deficit)}`} icon={XCircle} dot={false} size="sm" />;
};

// ── Selector de proveedor para un material con déficit ────────────────────────
const ProveedorSelector = ({ material, seleccion, onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const { proveedores } = material;

  if (proveedores.length === 0) {
    return (
      <p className="text-xs text-semantic-warning-fg mt-2 flex items-center gap-1">
        <AlertTriangle size={12} />
        Sin proveedores registrados para este material
      </p>
    );
  }

  const sel = seleccion?.[material.item_general_id];

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="text-xs font-semibold text-semantic-info-fg hover:text-semantic-info-fg flex items-center gap-1 transition-colors"
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {sel ? `Proveedor: ${sel.nombre_empresa}` : 'Seleccionar proveedor'}
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {proveedores.map((p) => {
            const isSelected = sel?.id_item_proveedor === p.id_item_proveedor;
            return (
              <button
                key={p.id_item_proveedor}
                type="button"
                onClick={() => {
                  onSelect(material.item_general_id, p);
                  setExpanded(false);
                }}
                className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all ${
                  isSelected
                    ? 'border-semantic-info/70 bg-semantic-info-subtle'
                    : 'border-border-base hover:border-semantic-info/30 hover:bg-surface-subtle'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-content-primary flex items-center gap-1">
                    <Building2 size={11} className="text-content-muted" />
                    {p.nombre_empresa}
                  </span>
                  <span className="text-xs font-bold text-content-secondary">
                    {fmtCOP(p.precio_con_iva)}{' '}
                    <span className="text-content-muted font-normal">/ {p.unidad_empaque}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {p.telefono && (
                    <span className="text-[10px] text-content-muted flex items-center gap-0.5">
                      <Phone size={9} /> {p.telefono}
                    </span>
                  )}
                  {p.email && (
                    <span className="text-[10px] text-content-muted flex items-center gap-0.5">
                      <Mail size={9} /> {p.email}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Fila de material ──────────────────────────────────────────────────────────
const MaterialRow = ({ material, seleccion, onSelect }) => (
  <div
    className={`rounded-xl border px-4 py-3 ${
      material.tiene_deficit
        ? 'border-semantic-danger/20 bg-semantic-danger-subtle/40'
        : 'border-border-subtle bg-surface-base'
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="font-semibold text-sm text-content-primary truncate">{material.nombre}</p>
        <p className="text-[10px] text-content-muted font-mono">{material.codigo}</p>
      </div>
      <EstadoChip tieneDeficit={material.tiene_deficit} deficit={material.deficit} />
    </div>

    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
      <div>
        <span className="text-content-muted">Necesario</span>
        <p className="font-semibold text-content-secondary">{fmtNum(material.cantidad_necesaria)}</p>
      </div>
      <div>
        <span className="text-content-muted">En stock</span>
        <p className={`font-semibold ${material.tiene_deficit ? 'text-semantic-danger-fg' : 'text-semantic-success-fg'}`}>
          {fmtNum(material.cantidad_disponible)}
        </p>
      </div>
      {material.tiene_deficit && (
        <div>
          <span className="text-content-muted">A comprar</span>
          <p className="font-semibold text-semantic-danger-fg">{fmtNum(material.deficit)}</p>
        </div>
      )}
    </div>

    {material.tiene_deficit && (
      <ProveedorSelector
        material={material}
        seleccion={seleccion}
        onSelect={onSelect}
      />
    )}
  </div>
);

// ── Modal principal ───────────────────────────────────────────────────────────
/**
 * Props:
 *  - itemGeneralId   (int)
 *  - cantidad        (float)  — en la unidad dada
 *  - unidadId        (int)
 *  - preparacionId   (int|null) — null si aún no existe (creación); int si ya existe
 *  - onConfirmar     () => void  — procede a crear/lanzar la producción
 *  - onClose         () => void
 */
const DisponibilidadModal = ({
  itemGeneralId,
  cantidad,
  unidadId,
  preparacionId = null,
  onConfirmar,
  onClose,
}) => {
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [cargando,       setCargando]       = useState(true);
  const [error,          setError]          = useState(null);
  // Mapa: item_general_id → proveedor seleccionado
  const [seleccion, setSeleccion] = useState({});

  const { verificar }          = useVerificarDisponibilidad();
  const crearRequisiciones     = useCrearRequisiciones();

  // Ejecuta la verificación al montar / al cambiar inputs
  useEffect(() => {
    let cancelled = false;
    verificar(itemGeneralId, cantidad, unidadId)
      .then((data) => {
        if (cancelled) return;
        setDisponibilidad(data);
        setError(null);
        setCargando(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.response?.data?.message ?? 'Error al verificar disponibilidad');
        setCargando(false);
      });
    return () => { cancelled = true; };
  }, [itemGeneralId, cantidad, unidadId, verificar]);

  const handleSelectProveedor = (itemId, proveedor) => {
    setSeleccion((prev) => ({ ...prev, [itemId]: proveedor }));
  };

  const materialesConDeficit = disponibilidad?.materiales?.filter((m) => m.tiene_deficit) ?? [];
  const requisicionesPendientes = materialesConDeficit.filter(
    (m) => !seleccion[m.item_general_id]
  );

  // Construye los items de requisición (sin preparacion_id — lo añade el padre)
  const buildRequisicionItems = () =>
    materialesConDeficit
      .filter((m) => seleccion[m.item_general_id])
      .map((m) => {
        const prov = seleccion[m.item_general_id];
        return {
          item_general_id:     m.item_general_id,
          item_proveedor_id:   prov.id_item_proveedor,
          proveedor_id:        prov.id_proveedor,
          cantidad_necesaria:  m.cantidad_necesaria,
          cantidad_disponible: m.cantidad_disponible,
          cantidad_solicitada: m.deficit,
          precio_unitario:     prov.precio_con_iva,
        };
      });

  const handleCrearRequisiciones = () => {
    const requisicionItems = buildRequisicionItems();

    if (!preparacionId) {
      // El padre creará la preparación y luego añadirá el preparacion_id
      onConfirmar({ crearRequisicionesDespues: true, requisicionItems });
      return;
    }

    const itemsConPrep = requisicionItems.map((r) => ({
      ...r, preparacion_id: preparacionId,
    }));

    crearRequisiciones.mutate(itemsConPrep, {
      onSuccess: () => onConfirmar({ requisicionesCreadas: true }),
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-surface-overlay backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto bg-surface-base rounded-2xl shadow-2xl border border-border-base w-full max-w-lg max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-content-tertiary" />
              <div>
                <h2 className="font-bold text-content-primary text-sm uppercase tracking-wide">
                  Verificación de Materiales
                </h2>
                <p className="text-[11px] text-content-muted">
                  Disponibilidad antes de lanzar producción
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="p-1.5 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-lg transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {cargando && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-content-muted">
                <Loader2 size={28} className="animate-spin" />
                <p className="text-sm">Verificando disponibilidad de materiales...</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-semantic-danger-fg bg-semantic-danger-subtle border border-semantic-danger/20 rounded-xl p-4">
                <AlertTriangle size={16} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {!cargando && !error && disponibilidad && (
              <>
                {/* Resumen */}
                <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                  disponibilidad.todos_disponibles
                    ? 'bg-semantic-success-subtle border-semantic-success/20'
                    : 'bg-semantic-warning-subtle border-semantic-warning/20'
                }`}>
                  {disponibilidad.todos_disponibles ? (
                    <CheckCircle2 size={18} className="text-semantic-success-fg shrink-0" />
                  ) : (
                    <AlertTriangle size={18} className="text-semantic-warning-fg shrink-0" />
                  )}
                  <p className={`text-sm font-semibold ${
                    disponibilidad.todos_disponibles ? 'text-semantic-success-fg' : 'text-semantic-warning-fg'
                  }`}>
                    {disponibilidad.todos_disponibles
                      ? 'Todos los materiales están disponibles en inventario'
                      : `${materialesConDeficit.length} material(es) con déficit de stock`}
                  </p>
                </div>

                {/* Lista de materiales */}
                <div className="space-y-2">
                  {disponibilidad.materiales.map((m) => (
                    <MaterialRow
                      key={m.item_general_id}
                      material={m}
                      seleccion={seleccion}
                      onSelect={handleSelectProveedor}
                    />
                  ))}
                </div>

                {/* Aviso si quedan déficits sin proveedor */}
                {materialesConDeficit.length > 0 && requisicionesPendientes.length > 0 && (
                  <p className="text-xs text-semantic-warning-fg bg-semantic-warning-subtle border border-semantic-warning/20 rounded-xl px-3 py-2 flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    {requisicionesPendientes.length} material(es) sin proveedor seleccionado — no se crearán sus requisiciones
                  </p>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!cargando && !error && disponibilidad && (
            <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle/50 flex flex-col gap-2">

              {/* Acción principal: siempre disponible */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm text-content-tertiary hover:text-content-primary px-4 py-2 rounded-xl hover:bg-surface-strong/60 transition-all"
                >
                  Cancelar
                </button>

                {disponibilidad.todos_disponibles ? (
                  <button
                    type="button"
                    onClick={() => onConfirmar({})}
                    className="flex items-center gap-1.5 text-sm font-semibold bg-content-primary text-content-inverse px-4 py-2 rounded-xl hover:bg-content-secondary transition-all"
                  >
                    <CheckCircle2 size={15} />
                    Lanzar producción
                  </button>
                ) : (
                  /* Hay déficit: lanzar de todas formas es la acción primaria */
                  <button
                    type="button"
                    onClick={() => onConfirmar({ omitirRequisiciones: true })}
                    className="flex items-center gap-1.5 text-sm font-semibold bg-content-primary text-content-inverse px-4 py-2 rounded-xl hover:bg-content-secondary transition-all"
                  >
                    <CheckCircle2 size={15} />
                    Lanzar de todas formas
                  </button>
                )}
              </div>

              {/* Acción secundaria: crear requisiciones (solo si hay déficits con proveedor seleccionado) */}
              {materialesConDeficit.length > 0 && Object.keys(seleccion).length > 0 && (
                <button
                  type="button"
                  onClick={handleCrearRequisiciones}
                  disabled={crearRequisiciones.isPending}
                  className="flex items-center justify-center gap-1.5 w-full text-sm font-semibold border-2 border-content-primary text-content-primary px-4 py-2 rounded-xl hover:bg-surface-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {crearRequisiciones.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ClipboardList size={15} />
                  )}
                  Crear requisiciones y lanzar
                </button>
              )}

            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default DisponibilidadModal;
