import { CheckCircle2, ClipboardList, Loader2 } from 'lucide-react';

export const ModalFooter = ({
  disponibilidad, materialesConDeficit, seleccion,
  onClose, onConfirmar, handleCrearRequisiciones, crearRequisiciones,
}) => (
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
);

export default ModalFooter;
