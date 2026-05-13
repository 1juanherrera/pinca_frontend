import cn from '../utils/cn';

/**
 * Barra de progreso indeterminada en la parte superior (NProgress / YouTube style).
 *
 * Pensada para feedback de carga global sin ocupar espacio del layout: una
 * barra delgada brand-primary que se desplaza horizontalmente.
 *
 * Por default es `position: absolute` arriba del contenedor padre — el padre
 * debe ser `position: relative`. Para usar fixed (top de la página entera),
 * pasar `fixed` prop.
 *
 * Props:
 *   active:  boolean        — si false, no renderiza nada
 *   tone:    'brand'|'info'|'success'|'warning'  — color (default brand)
 *   fixed:   boolean        — fixed top en lugar de absolute (default false)
 *   className
 */
const TONE_BG = {
  brand:   'bg-brand-primary',
  info:    'bg-semantic-info',
  success: 'bg-semantic-success',
  warning: 'bg-semantic-warning',
};

const TopProgressBar = ({ active = true, tone = 'brand', fixed = false, className = '' }) => {
  if (!active) return null;
  const bar = TONE_BG[tone] ?? TONE_BG.brand;

  return (
    <div
      role="progressbar"
      aria-busy="true"
      aria-label="Cargando"
      className={cn(
        'left-0 right-0 h-0.5 overflow-hidden pointer-events-none z-30',
        fixed ? 'fixed top-0' : 'absolute top-0',
        className,
      )}
    >
      <div className={cn('h-full w-1/3 rounded-r-full animate-top-progress', bar)} />
    </div>
  );
};

export default TopProgressBar;
