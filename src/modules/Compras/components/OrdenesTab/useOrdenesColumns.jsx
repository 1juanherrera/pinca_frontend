import { useMemo } from 'react';
import { Send, Pencil, Trash2, Download, FileSpreadsheet } from 'lucide-react';
import StatusBadge from '../../../../shared/StatusBadge';
import AmountDisplay from '../../../../shared/AmountDisplay';
import { fmtFechaCorta } from '../../../../utils/formatters';
import { exportOrdenesCompraExcel } from '../ExportOrdenCompraExcel';

export const useOrdenesColumns = ({
  selectedIds, allVisibleSelected, someVisibleSelected, toggleSelected, toggleSelectAllVisible,
  openConfirm, openDrawer, removeAsync, cambiarEstadoAsync, onVerDetalle, ivaPct,
}) => useMemo(() => [
  {
    key:      '__select',
    label: (
      <input
        type="checkbox"
        checked={allVisibleSelected}
        ref={(el) => { if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected; }}
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
        checked={selectedIds.has(row.id_orden)}
        onClick={(e) => e.stopPropagation()}
        onChange={() => toggleSelected(row.id_orden)}
        aria-label={`Seleccionar orden ${row.numero}`}
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
    key:   'nombre_empresa',
    label: 'Proveedor',
    className: 'w-48',
    render: (v, row) => (
      <div className="min-w-0">
        <p className="font-semibold text-content-primary text-xs leading-none truncate">{v || row.nombre_encargado}</p>
        <p className="text-[10px] text-content-muted mt-0.5 truncate">{row.bodega_nombre}</p>
      </div>
    ),
  },
  {
    key:       'fecha',
    label:     'Fecha',
    className: 'w-28',
    render: (v) => (
      <span className="text-xs text-content-tertiary tabular-nums whitespace-nowrap">
        {fmtFechaCorta(v)}
      </span>
    ),
  },
  {
    key:       'fecha_esperada',
    label:     'F. esperada',
    className: 'w-28',
    render: (v) => (
      <span className="text-xs text-content-tertiary tabular-nums whitespace-nowrap">
        {fmtFechaCorta(v)}
      </span>
    ),
  },
  {
    key:       'total',
    label:     'Subtotal',
    align:     'right',
    className: 'w-32',
    render: (v) => <AmountDisplay value={v} />,
  },
  {
    key:       'total_iva',
    label:     'Total + IVA',
    align:     'right',
    className: 'w-32',
    render: (_, row) => {
      // Usa el total_con_iva real de la OC; el cálculo con ivaPct de config es solo fallback.
      const sub = Number(row.total ?? 0);
      const totalConIva = row.total_con_iva ?? Math.round(sub * (1 + (row.iva_pct ?? ivaPct) / 100));
      return <AmountDisplay value={totalConIva} />;
    },
  },
  {
    key:       'estado',
    label:     'Estado',
    align:     'center',
    className: 'w-28',
    render: (v) => <StatusBadge estado={v} size="sm" dot={false} fixedWidth />,
  },
  {
    key:      'acciones',
    label:    'Acciones',
    align:    'right',
    className: 'w-44',
    sortable: false,
    render: (_, row) => (
      <div className="flex items-center justify-end gap-1.5">
        {/* Enviar */}
        {row.estado === 'Borrador' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirm({
                title:     'Enviar orden',
                message:   `¿Marcar la orden ${row.numero} como enviada?`,
                variant:  'info',
                onConfirm: async () => await cambiarEstadoAsync({ id: row.id_orden, estado: 'Enviada' }),
              });
            }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-semantic-info hover:text-white hover:border-semantic-info transition-all active:scale-95"
            title="Marcar como enviada"
          >
            <Send size={12} />
          </button>
        )}

        {/* Exportar Excel */}
        <button
          onClick={(e) => { e.stopPropagation(); exportOrdenesCompraExcel(row, { ivaPct }); }}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
          title="Exportar Excel"
        >
          <FileSpreadsheet size={12} />
        </button>

        {/* Exportar PDF */}
        <button
          onClick={(e) => { e.stopPropagation(); openDrawer('EXPORT_MODAL_OC', row); }}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
          title="Descargar PDF"
        >
          <Download size={12} />
        </button>

        {/* Ver detalle */}
        <button
          onClick={(e) => { e.stopPropagation(); onVerDetalle(row); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all"
        >
          Ver
        </button>

        {/* Editar — solo Borrador */}
        {row.estado === 'Borrador' && (
          <button
            onClick={(e) => { e.stopPropagation(); openDrawer('ORDEN_COMPRA_FORM', row); }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
            title="Editar"
          >
            <Pencil size={12}/>
          </button>
        )}

        {/* Eliminar — solo Borrador */}
        {row.estado === 'Borrador' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirm({
                title:     'Eliminar orden',
                message:   `¿Eliminar la orden ${row.numero}?`,
                onConfirm: async () => await removeAsync(row.id_orden),
              });
            }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-semantic-danger hover:text-white hover:border-semantic-danger transition-all active:scale-95"
            title="Eliminar"
          >
            <Trash2 size={12}/>
          </button>
        )}
      </div>
    ),
  },
], [openConfirm, openDrawer, removeAsync, cambiarEstadoAsync, onVerDetalle, ivaPct,
  selectedIds, allVisibleSelected, someVisibleSelected,
  toggleSelected, toggleSelectAllVisible]);

export default useOrdenesColumns;
