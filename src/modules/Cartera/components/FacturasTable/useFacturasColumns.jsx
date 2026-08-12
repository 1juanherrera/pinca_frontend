import { useMemo } from 'react';
import { CreditCard, AlertCircle, Phone, FileMinus, User } from 'lucide-react';
import StatusBadge from '../../../../shared/StatusBadge';
import AmountDisplay from '../../../../shared/AmountDisplay';
import { fmt, fmtFechaCorta } from '../../../../utils/formatters';
import { calcularDiasMora, getEstadoEfectivo } from '../../services/carteraService';
import { SECTOR_LABEL } from './constants';

export const useFacturasColumns = ({
  selected, allVisibleSelected, someVisibleSelected, toggleSelected, toggleSelectAllVisible,
  onRegistrarPago, onGestiones, onNotas, onEstadoCuenta,
}) => useMemo(() => [
  {
    key:       '__select',
    label: (
      <input
        type="checkbox"
        checked={allVisibleSelected}
        ref={(el) => {
          if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected;
        }}
        onChange={toggleSelectAllVisible}
        aria-label="Seleccionar todas las visibles"
        className="cursor-pointer accent-content-primary"
      />
    ),
    className: 'w-10',
    sortable: false,
    render: (_, row) => (
      <input
        type="checkbox"
        checked={selected.has(row.id_facturas)}
        onClick={(e) => e.stopPropagation()}
        onChange={() => toggleSelected(row.id_facturas)}
        aria-label={`Seleccionar factura ${row.numero}`}
        className="cursor-pointer accent-content-primary"
      />
    ),
  },
  {
    key:       'numero',
    label:     'Número',
    className: 'w-28',
    render: (v) => (
      <span className=" text-xs font-bold text-content-muted whitespace-nowrap">{v}</span>
    ),
  },
  {
    key:   'cliente',
    label: 'Cliente',
    render: (_, row) => (
      <div className="min-w-0">
        <p className="font-semibold text-content-primary text-xs leading-none truncate uppercase">
          {row.nombre_empresa || row.nombre_encargado || `#${row.cliente_id}`}
        </p>
        <p className="text-[10px] text-content-muted mt-0.5 truncate">
          {SECTOR_LABEL[String(row.cliente_tipo)] ?? 'Cliente'}
          {row.ciudad ? ` · ${row.ciudad}` : ''}
        </p>
      </div>
    ),
  },
  {
    key:       'fecha_emision',
    label:     'Emisión',
    render: (v) => (
      <span className="text-xs text-content-tertiary tabular-nums whitespace-nowrap">
        {fmtFechaCorta(v)}
      </span>
    ),
  },
  {
    key:       'fecha_vencimiento',
    label:     'Vencimiento',
    render: (v, row) => {
      const dias   = calcularDiasMora(v);
      const enMora = dias > 0 && getEstadoEfectivo(row) !== 'Pagada';
      return (
        <div className={`inline-flex items-center gap-1.5 text-xs tabular-nums whitespace-nowrap ${
          enMora ? 'text-semantic-danger-fg font-semibold' : 'text-content-tertiary'
        }`}>
          {enMora && <AlertCircle size={12} className="shrink-0" />}
          {v ?? '—'}
        </div>
      );
    },
  },
  {
    key:       'total',
    label:     'Total',
    align:     'right',
    render: (v) => <AmountDisplay value={v} />,
  },
  {
    key:       'saldo_pendiente',
    label:     'Saldo',
    align:     'right',
    render: (v) => (
      <span className={`tabular-nums py-1 text-right font-medium text-xs whitespace-nowrap ${
        Number(v) > 0 ? 'text-semantic-warning-fg' : 'text-semantic-success-fg'
      }`}>
        {fmt(v)}
      </span>
    ),
  },
  {
    key:       'mora',
    label:     'Mora',
    align:     'center',
    render: (_, row) => {
      const dias   = calcularDiasMora(row.fecha_vencimiento);
      const enMora = dias > 0 && getEstadoEfectivo(row) !== 'Pagada';
      if (!enMora) return <span className="text-content-muted text-xs">—</span>;
      return <StatusBadge tone="danger" label={`${dias}d`} dot={false} size="sm" />;
    },
  },
  {
    key:       'estado',
    label:     'Estado',
    align:     'center',
    className: 'w-40',
    render: (_, row) => <StatusBadge estado={getEstadoEfectivo(row)} />,
  },
  {
    key:      'acciones',
    label:    'Acciones',
    align:    'right',
    className: 'w-36 pr-18',
    sortable: false,
    render: (_, row) => {
      const pagada = getEstadoEfectivo(row) === 'Pagada';
      return (
        <div className="flex items-center justify-end gap-1.5">
          {!pagada && (
            <button
              onClick={(e) => { e.stopPropagation(); onRegistrarPago?.(row); }}
              title="Registrar pago"
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-semantic-success hover:text-white hover:border-semantic-success transition-all active:scale-95"
            >
              <CreditCard size={12} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onGestiones?.(row); }}
            title="Gestiones de cobro"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-semantic-info hover:text-white hover:border-semantic-info transition-all active:scale-95"
          >
            <Phone size={12} />
          </button>
          {!pagada && (
            <button
              onClick={(e) => { e.stopPropagation(); onNotas?.(row); }}
              title="Notas crédito"
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-semantic-danger hover:text-white hover:border-semantic-danger transition-all active:scale-95"
            >
              <FileMinus size={12} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEstadoCuenta?.(row); }}
            title="Estado de cuenta"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all"
          >
            <User size={12} /> Ver
          </button>
        </div>
      );
    },
  },
], [
  onRegistrarPago, onGestiones, onNotas, onEstadoCuenta,
  selected, allVisibleSelected, someVisibleSelected,
  toggleSelected, toggleSelectAllVisible,
]);

export default useFacturasColumns;
