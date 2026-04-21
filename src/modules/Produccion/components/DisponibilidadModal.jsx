import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, CheckCircle2, AlertTriangle, XCircle,
  ChevronDown, ChevronUp, Loader2, ShoppingCart,
  Package, Building2, Phone, Mail, ClipboardList,
} from 'lucide-react';
import { useVerificarDisponibilidad, useCrearRequisiciones } from '../api/useRequisiciones';

const fmtNum = (v) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(Number(v) || 0);

const fmtCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0);

// ── Badge de estado por material ──────────────────────────────────────────────
const EstadoChip = ({ tieneDeficit, deficit }) => {
  if (!tieneDeficit) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
        <CheckCircle2 size={12} /> Disponible
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
      <XCircle size={12} /> Déficit {fmtNum(deficit)}
    </span>
  );
};

// ── Selector de proveedor para un material con déficit ────────────────────────
const ProveedorSelector = ({ material, seleccion, onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const { proveedores } = material;

  if (proveedores.length === 0) {
    return (
      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
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
        className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
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
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-zinc-200 hover:border-blue-300 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-zinc-800 flex items-center gap-1">
                    <Building2 size={11} className="text-zinc-400" />
                    {p.nombre_empresa}
                  </span>
                  <span className="text-xs font-bold text-zinc-700">
                    {fmtCOP(p.precio_con_iva)}{' '}
                    <span className="text-zinc-400 font-normal">/ {p.unidad_empaque}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {p.telefono && (
                    <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                      <Phone size={9} /> {p.telefono}
                    </span>
                  )}
                  {p.email && (
                    <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
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
        ? 'border-red-200 bg-red-50/40'
        : 'border-zinc-100 bg-white'
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="font-semibold text-sm text-zinc-800 truncate">{material.nombre}</p>
        <p className="text-[10px] text-zinc-400 font-mono">{material.codigo}</p>
      </div>
      <EstadoChip tieneDeficit={material.tiene_deficit} deficit={material.deficit} />
    </div>

    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
      <div>
        <span className="text-zinc-400">Necesario</span>
        <p className="font-semibold text-zinc-700">{fmtNum(material.cantidad_necesaria)}</p>
      </div>
      <div>
        <span className="text-zinc-400">En stock</span>
        <p className={`font-semibold ${material.tiene_deficit ? 'text-red-600' : 'text-emerald-600'}`}>
          {fmtNum(material.cantidad_disponible)}
        </p>
      </div>
      {material.tiene_deficit && (
        <div>
          <span className="text-zinc-400">A comprar</span>
          <p className="font-semibold text-red-700">{fmtNum(material.deficit)}</p>
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

  // Ejecuta la verificación al montar
  useEffect(() => {
    setCargando(true);
    setError(null);
    verificar(itemGeneralId, cantidad, unidadId)
      .then((data) => setDisponibilidad(data))
      .catch((e)   => setError(e?.response?.data?.message ?? 'Error al verificar disponibilidad'))
      .finally(()  => setCargando(false));
  }, [itemGeneralId, cantidad, unidadId]);

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
      <div className="fixed inset-0 z-[60] bg-zinc-950/50 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-lg max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-zinc-500" />
              <div>
                <h2 className="font-bold text-zinc-900 text-sm uppercase tracking-wide">
                  Verificación de Materiales
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Disponibilidad antes de lanzar producción
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {cargando && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400">
                <Loader2 size={28} className="animate-spin" />
                <p className="text-sm">Verificando disponibilidad de materiales...</p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4">
                <AlertTriangle size={16} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {!cargando && !error && disponibilidad && (
              <>
                {/* Resumen */}
                <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                  disponibilidad.todos_disponibles
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  {disponibilidad.todos_disponibles ? (
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                  )}
                  <p className={`text-sm font-semibold ${
                    disponibilidad.todos_disponibles ? 'text-emerald-800' : 'text-amber-800'
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
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
                    <AlertTriangle size={12} />
                    {requisicionesPendientes.length} material(es) sin proveedor seleccionado — no se crearán sus requisiciones
                  </p>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!cargando && !error && disponibilidad && (
            <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50/50 flex flex-col gap-2">

              {/* Acción principal: siempre disponible */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm text-zinc-500 hover:text-zinc-800 px-4 py-2 rounded-xl hover:bg-zinc-200/60 transition-all"
                >
                  Cancelar
                </button>

                {disponibilidad.todos_disponibles ? (
                  <button
                    type="button"
                    onClick={() => onConfirmar({})}
                    className="flex items-center gap-1.5 text-sm font-semibold bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition-all"
                  >
                    <CheckCircle2 size={15} />
                    Lanzar producción
                  </button>
                ) : (
                  /* Hay déficit: lanzar de todas formas es la acción primaria */
                  <button
                    type="button"
                    onClick={() => onConfirmar({ omitirRequisiciones: true })}
                    className="flex items-center gap-1.5 text-sm font-semibold bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-700 transition-all"
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
                  className="flex items-center justify-center gap-1.5 w-full text-sm font-semibold border-2 border-zinc-900 text-zinc-900 px-4 py-2 rounded-xl hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
