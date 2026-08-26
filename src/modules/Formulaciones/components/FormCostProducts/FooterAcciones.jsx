import { Save } from 'lucide-react';

export const FooterAcciones = ({ isDirty, precioManualDirty, isUpdating, isUpdatingPrecio, handleClose, formId }) => (
  <div className="flex items-center justify-between gap-3 w-full">
    <div className="flex items-center gap-1.5">
      {(isDirty || precioManualDirty) ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-semantic-warning" />
          <span className="text-[10px] font-bold text-semantic-warning-fg uppercase tracking-wider">Cambios sin guardar</span>
        </>
      ) : (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-surface-strong" />
          <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider">Sin cambios</span>
        </>
      )}
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClose}
        disabled={isUpdating}
        className="flex items-center gap-2 px-5 py-2.5 border border-border-base rounded-xl text-sm font-semibold text-content-secondary bg-surface-base shadow-sm hover:bg-surface-subtle transition-all active:scale-95 disabled:opacity-50"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form={formId}
        disabled={isUpdating || isUpdatingPrecio || (!isDirty && !precioManualDirty)}
        className="flex items-center gap-2 px-5 py-2.5 border border-transparent rounded-xl text-sm font-semibold text-content-inverse bg-content-primary shadow-md shadow-content-primary/20 hover:bg-content-primary transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {(isUpdating || isUpdatingPrecio) ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Save size={15} />
            Guardar
          </>
        )}
      </button>
    </div>
  </div>
);

export default FooterAcciones;
