/**
 * DateRangePicker — selector de rango de fechas con calendario popover
 * estilizado al sistema Pinca (no usa el input nativo del navegador).
 *
 * Powered by react-day-picker. Tokens de Pinca aplicados via clase props.
 *
 * Uso:
 *   <DateRangePicker
 *     desde={'2026-05-01'}    // ISO yyyy-mm-dd
 *     hasta={'2026-05-15'}
 *     onChange={({ desde, hasta }) => ...}
 *   />
 */
import { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown, X, ArrowRight } from 'lucide-react';
import 'react-day-picker/style.css';

const isoToDate = (iso) => {
  if (!iso) return undefined;
  const d = parseISO(iso);
  return isValid(d) ? d : undefined;
};

const dateToIso = (d) => (d ? format(d, 'yyyy-MM-dd') : null);

// "5 May 2026" — formato corto, legible, sin comilla rara
export const fmtFechaChip = (d) => {
  if (!d) return null;
  const date = typeof d === 'string' ? isoToDate(d) : d;
  if (!date) return null;
  const s = format(date, 'd MMM yyyy', { locale: es });
  // Capitalizar el mes (date-fns devuelve en minúsculas)
  return s.replace(/\s([a-z])/, (_, c) => ' ' + c.toUpperCase());
};

const fmtChip = fmtFechaChip;

const DateRangePicker = ({ desde, hasta, onChange, align = 'left' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const range = {
    from: isoToDate(desde),
    to:   isoToDate(hasta),
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const handleSelect = (newRange) => {
    onChange?.({
      desde: dateToIso(newRange?.from),
      hasta: dateToIso(newRange?.to ?? newRange?.from),
    });
    if (newRange?.from && newRange?.to) {
      setTimeout(() => setOpen(false), 150);
    }
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange?.({ desde: null, hasta: null });
  };

  const fromChip = fmtChip(range.from);
  const toChip   = fmtChip(range.to);
  const tieneRango = !!(range.from || range.to);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 pl-2.5 pr-2 py-1 text-xs font-semibold bg-white border rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 ${
          open ? 'border-content-primary shadow-sm' : 'border-border-base hover:border-border-strong'
        }`}
      >
        <CalendarIcon size={13} className="text-content-tertiary shrink-0" />

        {tieneRango ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-surface-muted text-content-primary tabular-nums">
              {fromChip ?? '—'}
            </span>
            <ArrowRight size={11} className="text-content-muted shrink-0" />
            <span className="px-2 py-0.5 rounded-md bg-surface-muted text-content-primary tabular-nums">
              {toChip ?? '—'}
            </span>
          </span>
        ) : (
          <span className="text-content-tertiary">Seleccionar fechas</span>
        )}

        {tieneRango && (
          <span
            role="button"
            onClick={clear}
            title="Limpiar rango"
            className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-md text-content-muted hover:bg-semantic-danger-subtle hover:text-semantic-danger-fg transition"
          >
            <X size={11} />
          </span>
        )}
        <ChevronDown size={11} className={`text-content-muted transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-2 ${align === 'right' ? 'right-0' : 'left-0'} bg-white border border-border-base rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95`}
        >
          <DayPicker
            mode="range"
            locale={es}
            numberOfMonths={2}
            selected={range}
            onSelect={handleSelect}
            weekStartsOn={1}
            captionLayout="dropdown"
            startMonth={new Date(new Date().getFullYear() - 3, 0)}
            endMonth={new Date(new Date().getFullYear() + 2, 11)}
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
              button_next:'w-7 h-7 inline-flex items-center justify-center rounded-md text-content-tertiary hover:bg-surface-muted hover:text-content-primary transition',
              month_grid:  'border-collapse',
              weekday:     'text-[9px] font-bold uppercase tracking-widest text-content-muted py-1',
              day:         'p-0',
              day_button:  'w-8 h-8 text-xs font-medium text-content-secondary rounded-md hover:bg-surface-muted hover:text-content-primary transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40',
              outside:     'text-content-muted/40',
              disabled:    'text-content-muted/30 cursor-not-allowed',
              hidden:      'invisible',
            }}
            modifiers={{
              today: new Date(),
            }}
            modifiersClassNames={{
              // Hoy SIN selección: chip amarillo claro con borde
              today:       'rdp-today-pinca',
              // Selección/rango — overrides agresivos para garantizar visibilidad
              selected:    'rdp-selected-pinca',
              range_start: 'rdp-range-edge-pinca',
              range_end:   'rdp-range-edge-pinca',
              range_middle:'rdp-range-middle-pinca',
            }}
          />

          {/* Estilos custom para hoy/selección — fuerzan visibilidad sobre cualquier override de RDP */}
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
            .pinca-rdp .rdp-range-edge-pinca > button {
              background: var(--content-primary) !important;
              color: #fff !important;
              font-weight: 700;
            }
            .pinca-rdp .rdp-range-middle-pinca > button {
              background: var(--brand-subtle) !important;
              color: var(--content-primary) !important;
              border-radius: 0 !important;
            }
            .pinca-rdp .rdp-range-edge-pinca.rdp-today-pinca > button,
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
            <p className="text-[11px] text-content-tertiary">
              {range.from && range.to
                ? `${Math.round((range.to - range.from) / 86400000) + 1} días`
                : 'Hacé click para elegir inicio y fin'}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-1 text-[11px] font-bold text-white bg-content-primary rounded-md hover:bg-content-secondary transition"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
