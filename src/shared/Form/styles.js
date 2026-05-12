/**
 * Constantes de estilo para componentes de formulario.
 * Single source of truth — todos los inputs deben referenciar estas constantes
 * en lugar de hardcodear clases Tailwind.
 *
 * Densidad: ERP compacto (py-1.5, text-sm).
 */

/** Wrapper del input — borde + fondo + radio + foco */
export const INPUT_BASE =
  'w-full text-sm bg-surface-base border border-border-base rounded-md ' +
  'px-3 py-1.5 text-content-primary placeholder:text-content-muted ' +
  'transition-colors ' +
  'focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus/15 ' +
  'disabled:bg-surface-muted disabled:text-content-muted disabled:cursor-not-allowed';

/** Variante densa (py-1) para grids o filtros compactos */
export const INPUT_BASE_DENSE =
  'w-full text-xs bg-surface-base border border-border-base rounded-md ' +
  'px-2.5 py-1 text-content-primary placeholder:text-content-muted ' +
  'transition-colors ' +
  'focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus/15';

/** Estado de error — combina con INPUT_BASE via cn() */
export const INPUT_ERROR =
  'border-semantic-danger focus:border-semantic-danger focus:ring-semantic-danger/20';

/** Label estándar — sobre el input */
export const LABEL_BASE =
  'block text-xs font-medium text-content-secondary mb-1';

/** Label con asterisco para campos requeridos */
export const LABEL_REQUIRED_MARK =
  'text-semantic-danger ml-0.5';

/** Texto de ayuda — debajo del input */
export const FIELD_HINT =
  'mt-1 text-[11px] text-content-tertiary';

/** Mensaje de error — debajo del input */
export const FIELD_ERROR =
  'mt-1 text-[11px] text-semantic-danger flex items-center gap-1';

/** Wrapper de un field completo: label + input + hint/error */
export const FIELD_WRAPPER = 'flex flex-col';

/** Para inputs dentro de celdas de tabla (GridInput) */
export const GRID_INPUT_BASE =
  'w-full bg-transparent text-xs px-2 py-1 ' +
  'focus:outline-none focus:bg-surface-base focus:ring-1 focus:ring-border-focus/30 ' +
  'placeholder:text-content-muted';
