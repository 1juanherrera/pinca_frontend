import { FlaskConical, ChevronUp, ChevronDown, ClipboardList, Trash2, PlusCircle } from 'lucide-react';
import { IngredientCard } from './IngredientCard';

// ─── Sección 3: cards de ingredientes (reordenables) + pasos de proceso ──────
export const IngredientesList = ({
  fields, move, remove, append, register, setValue, errors,
  watchedMPs, modoGlobal, proveedores, handleProveedorChange, handleCostoChange, handleRemove,
}) => (
  <>
    {fields.length === 0 ? (
      <div className="py-14 text-center border-2 border-dashed border-border-base rounded-2xl">
        <FlaskConical size={28} className="mx-auto text-content-muted mb-2" />
        <p className="text-sm font-medium text-content-muted">Busca y agrega materias primas</p>
        <p className="text-xs text-content-muted mt-1">
          Incluye materiales de tu inventario o catálogo de proveedores
        </p>
      </div>
    ) : (
      <div className="space-y-2.5">
        {fields.map((field, index) => {
          const esInstruccion = field.tipo === 'instruccion' || field.tipo === 'fase';
          return (
          <div key={field.id} className="flex items-start gap-1.5">
            {/* Reordenar: el orden = secuencia de proceso (como la libreta) */}
            <div className="flex flex-col items-center gap-0.5 pt-1 shrink-0">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
                title="Subir (se agrega antes en el proceso)"
                className="w-6 h-6 flex items-center justify-center rounded-md border border-border-base text-content-muted hover:bg-surface-muted hover:text-content-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronUp size={13} />
              </button>
              <span className="text-[9px] font-bold text-content-muted tabular-nums">{index + 1}</span>
              <button
                type="button"
                disabled={index === fields.length - 1}
                onClick={() => move(index, index + 1)}
                title="Bajar (se agrega después en el proceso)"
                className="w-6 h-6 flex items-center justify-center rounded-md border border-border-base text-content-muted hover:bg-surface-muted hover:text-content-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronDown size={13} />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              {esInstruccion ? (
                <div className="flex items-center gap-2 rounded-xl border border-semantic-info/25 bg-semantic-info-subtle/40 px-3 py-2.5">
                  <ClipboardList size={14} className="text-semantic-info-fg shrink-0" />
                  <input
                    {...register(`materias_primas.${index}.texto`)}
                    placeholder="Paso de proceso (ej. Dispersar x 5 min y agregar)"
                    className="flex-1 min-w-0 bg-transparent text-xs text-content-primary placeholder:text-content-muted focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    title="Quitar paso"
                    className="shrink-0 text-content-muted hover:text-semantic-danger transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <IngredientCard
                    field={field}
                    index={index}
                    quantity={watchedMPs?.[index]?.cantidad}
                    modoGlobal={modoGlobal}
                    proveedorId={proveedores[field.id] ?? null}
                    onProveedorChange={handleProveedorChange}
                    onCostoChange={handleCostoChange}
                    onRemove={handleRemove}
                    register={register}
                    setValue={setValue}
                    errors={errors}
                    tabBase={10 + index * 2}
                  />
                  <input
                    {...register(`materias_primas.${index}.nota`)}
                    placeholder="Nota del ingrediente (opcional: pH, asociativo, pino…)"
                    className="w-full rounded-lg border border-border-base bg-surface-base px-2.5 py-1 text-[11px] text-content-secondary placeholder:text-content-muted focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
                  />
                </div>
              )}
            </div>
          </div>
          );
        })}
      </div>
    )}

    {/* Paso de proceso / instrucción (se intercala en el orden con los ingredientes) */}
    <button
      type="button"
      onClick={() => append({ tipo: 'instruccion', texto: '', materia_prima_id: '', cantidad: 0 })}
      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-semantic-info-fg border border-semantic-info/25 bg-semantic-info-subtle/40 rounded-lg hover:bg-semantic-info-subtle transition-colors"
    >
      <PlusCircle size={13} /> Agregar paso / instrucción
    </button>
  </>
);
