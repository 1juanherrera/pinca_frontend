/**
 * FormDate — selector de UNA fecha (popover + DayPicker), estilizado al
 * sistema Pinca. Reemplazo del <input type="date"> nativo.
 *
 * Funciona como componente controlado: `value` (ISO yyyy-MM-dd) + `onChange(iso)`.
 *
 * Uso simple (sin RHF):
 *   <FormDate label="Fecha" value={form.fecha} onChange={(iso) => setField('fecha', iso)} required />
 *
 * Uso con react-hook-form:
 *   <Controller name="fecha" control={control} rules={{ required: 'Requerido' }}
 *     render={({ field, fieldState }) => (
 *       <FormDate label="Fecha" required
 *         value={field.value} onChange={field.onChange}
 *         error={fieldState.error?.message}
 *       />
 *     )}
 *   />
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { format, parseISO, isValid } from 'date-fns';
import { AlertCircle, Calendar as CalendarIcon, ChevronDown, X } from 'lucide-react';
import 'react-day-picker/style.css';
import cn from '../../utils/cn';
import {
  INPUT_BASE, INPUT_ERROR,
  LABEL_BASE, LABEL_REQUIRED_MARK,
  FIELD_ERROR, FIELD_WRAPPER,
} from './styles';

const isoToDate = (iso) => {
  if (!iso) return undefined;
  const d = parseISO(iso);
  return isValid(d) ? d : undefined;
};
const dateToIso = (d) => (d ? format(d, 'yyyy-MM-dd') : null);

// "5 May 2026"
const fmtChip = (d) => {
  if (!d) return null;
  const date = typeof d === 'string' ? isoToDate(d) : d;
  if (!date) return null;
  const s = format(date, 'd MMM yyyy', { locale: es });
  return s.replace(/\s([a-z])/, (_, c) => ' ' + c.toUpperCase());
};

const FormDate = ({
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder = 'Seleccionar fecha',
  align = 'left',
  className = '',
  minDate,
  maxDate,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const selected = isoToDate(value);

  useEffect(() => {
    if (!open) return;
    const computePos = () => {
      const r = triggerRef.current?.getBoundingClientRect();
      if (!r) return;
      const POP_W  = 320;            // ancho aprox del popover
      const MARGIN = 8;              // respiro contra el borde del viewport
      const vw     = window.innerWidth;
      // Ancho disponible (en viewport chico el popover se encoge).
      const popW   = Math.min(POP_W, vw - MARGIN * 2);
      let left = align === 'right'
        ? r.right + window.scrollX - popW
        : r.left + window.scrollX;
      // Clamp horizontal: que no se desborde por izquierda ni derecha.
      const minLeft = window.scrollX + MARGIN;
      const maxLeft = window.scrollX + vw - popW - MARGIN;
      left = Math.max(minLeft, Math.min(left, maxLeft));
      setPos({ top: r.bottom + window.scrollY + 6, left, maxWidth: popW });
    };
    computePos();
    const onClick = (e) => {
      // El popover vive en un portal (fuera del wrapper), así que hay que
      // chequear ambos contenedores para no cerrarlo en sus propios clicks.
      const insideTrigger = wrapperRef.current?.contains(e.target);
      const insidePopover = popoverRef.current?.contains(e.target);
      if (!insideTrigger && !insidePopover) setOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    window.addEventListener('resize', computePos);
    window.addEventListener('scroll', computePos, true);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
      window.removeEventListener('resize', computePos);
      window.removeEventListener('scroll', computePos, true);
    };
  }, [open, align]);

  const handleSelect = (d) => {
    onChange?.(dateToIso(d));
    if (d) setTimeout(() => setOpen(false), 120);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.(null);
  };

  const chip = fmtChip(selected);

  return (
    <div ref={wrapperRef} className={cn(FIELD_WRAPPER, 'w-full')}>
      {label && (
        <label className={LABEL_BASE}>
          {label}{required && <span className={LABEL_REQUIRED_MARK}>*</span>}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          INPUT_BASE,
          'flex items-center justify-between gap-2 cursor-pointer text-left',
          error && INPUT_ERROR,
          disabled && 'opacity-60 cursor-not-allowed',
          className,
        )}
      >
        <span className="inline-flex items-center gap-2 min-w-0 flex-1">
          <CalendarIcon size={13} className="text-content-tertiary shrink-0" />
          {chip ? (
            <span className="text-content-primary tabular-nums truncate">{chip}</span>
          ) : (
            <span className="text-content-tertiary truncate">{placeholder}</span>
          )}
        </span>
        <span className="inline-flex items-center gap-1 shrink-0">
          {chip && !disabled && (
            <span
              role="button"
              onClick={handleClear}
              title="Limpiar fecha"
              className="inline-flex items-center justify-center w-5 h-5 rounded-md text-content-muted hover:bg-semantic-danger-subtle hover:text-semantic-danger-fg transition"
            >
              <X size={11} />
            </span>
          )}
          <ChevronDown size={11} className={cn('text-content-muted transition', open && 'rotate-180')} />
        </span>
      </button>

      {open && createPortal(
        <div
          ref={popoverRef}
          style={{ position: 'absolute', top: pos.top, left: pos.left, maxWidth: pos.maxWidth, zIndex: 130 }}
          className="bg-surface-base border border-border-base rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95 overflow-x-auto"
        >
          <DayPicker
            mode="single"
            locale={es}
            selected={selected}
            onSelect={handleSelect}
            weekStartsOn={1}
            captionLayout="dropdown"
            startMonth={new Date(new Date().getFullYear() - 3, 0)}
            endMonth={new Date(new Date().getFullYear() + 2, 11)}
            disabled={[
              minDate ? { before: isoToDate(minDate) } : null,
              maxDate ? { after:  isoToDate(maxDate) } : null,
            ].filter(Boolean)}
            classNames={{
              root:        'pinca-rdp text-xs',
              months:      'flex gap-4',
              month:       'flex flex-col gap-2',
              month_caption:'flex items-center justify-center',
              dropdowns:   'flex items-center gap-1.5',
              dropdown_root:'relative inline-flex items-center',
              dropdown:    'pinca-rdp-dropdown',
              caption_label:'sr-only',
              nav:         'flex items-center gap-1',
              button_previous:'w-7 h-7 inline-flex items-center justify-center rounded-md text-content-tertiary hover:bg-surface-muted hover:text-content-primary transition',
              button_next: 'w-7 h-7 inline-flex items-center justify-center rounded-md text-content-tertiary hover:bg-surface-muted hover:text-content-primary transition',
              month_grid:  'border-collapse',
              weekday:     'text-[9px] font-bold uppercase tracking-widest text-content-muted py-1',
              day:         'p-0',
              day_button:  'w-8 h-8 text-xs font-medium text-content-secondary rounded-md hover:bg-surface-muted hover:text-content-primary transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40',
              outside:     'text-content-muted/40',
              disabled:    'text-content-muted/30 cursor-not-allowed',
              hidden:      'invisible',
            }}
            modifiers={{ today: new Date() }}
            modifiersClassNames={{
              today:    'rdp-today-pinca',
              selected: 'rdp-selected-pinca',
            }}
          />

          {/* Estilos custom — fuerzan visibilidad sobre overrides de RDP */}
          <style>{`
            .pinca-rdp .rdp-today-pinca > button {
              background: var(--brand-subtle);
              color: var(--brand-primary-active);
              font-weight: 700;
              border: 1px solid color-mix(in srgb, var(--brand-primary) 40%, transparent);
            }
            .pinca-rdp .rdp-selected-pinca > button {
              background: var(--content-primary) !important;
              color: #fff !important;
              font-weight: 700;
              border: none !important;
            }
            .pinca-rdp .rdp-selected-pinca.rdp-today-pinca > button {
              background: var(--content-primary) !important;
              color: #fff !important;
              border: 2px solid var(--brand-primary) !important;
            }
            /* Dropdowns de mes / año */
            .pinca-rdp .pinca-rdp-dropdown {
              appearance: none;
              -webkit-appearance: none;
              -moz-appearance: none;
              background: var(--surface-muted);
              color: var(--content-primary);
              border: 1px solid var(--border-base);
              border-radius: 6px;
              padding: 1px 20px 1px 7px;
              line-height: 1.4;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.03em;
              cursor: pointer;
              outline: none;
              background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
              background-repeat: no-repeat;
              background-position: right 6px center;
              transition: border-color .15s, background-color .15s;
            }
            .pinca-rdp .pinca-rdp-dropdown:hover {
              border-color: var(--border-strong);
              background-color: var(--surface-strong);
            }
            .pinca-rdp .pinca-rdp-dropdown:focus-visible {
              border-color: var(--content-primary);
              box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-primary) 25%, transparent);
            }
          `}</style>

          <div className="mt-3 pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => handleSelect(new Date())}
              className="px-2 py-1 text-[11px] font-semibold text-content-tertiary hover:text-content-primary transition"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1 text-[11px] font-bold text-content-inverse bg-content-primary rounded-md hover:bg-content-secondary transition"
            >
              Listo
            </button>
          </div>
        </div>,
        document.body
      )}

      {error && (
        <span className={FIELD_ERROR}>
          <AlertCircle size={11} /> {error}
        </span>
      )}
    </div>
  );
};

export default FormDate;
