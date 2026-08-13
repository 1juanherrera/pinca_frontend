import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { useVerificarDisponibilidad, useCrearRequisiciones } from '../api/useRequisiciones';
import ModalHeader from './DisponibilidadModal/ModalHeader';
import ModalFooter from './DisponibilidadModal/ModalFooter';
import MaterialRow from './DisponibilidadModal/MaterialRow';

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
          <ModalHeader onClose={onClose} />

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

          {!cargando && !error && disponibilidad && (
            <ModalFooter
              disponibilidad={disponibilidad}
              materialesConDeficit={materialesConDeficit}
              seleccion={seleccion}
              onClose={onClose}
              onConfirmar={onConfirmar}
              handleCrearRequisiciones={handleCrearRequisiciones}
              crearRequisiciones={crearRequisiciones}
            />
          )}
        </div>
      </div>
    </>,
    document.body
  );
};

export default DisponibilidadModal;
