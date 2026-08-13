import { useMemo } from 'react';
import { ArrowRight, Eye, Trash2, Download, CircleAlert, FileSpreadsheet } from 'lucide-react';
import StatusBadge from '../../../../shared/StatusBadge';
import AmountDisplay from '../../../../shared/AmountDisplay';
import { fmtFechaCorta, estaVencida } from '../../../../utils/formatters';
import { exportCotizacionesExcel } from '../components/ExportCotizacionExcel';

export const useCotizacionesColumns = ({
  selectedIds, allVisibleSelected, someVisibleSelected, toggleSelected, toggleSelectAllVisible,
  openConfirm, openDrawer, removeAsync, convertir, setSelected,
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
        checked={selectedIds.has(row.id_cotizaciones)}
        onClick={(e) => e.stopPropagation()}
        onChange={() => toggleSelected(row.id_cotizaciones)}
        aria-label={`Seleccionar cotización ${row.numero}`}
        className="cursor-pointer accent-content-primary"
      />
    ),
  },
  {
    key:       'numero',
    label:     'Código',
    render: (v) => (
      <span className=" text-xs font-bold text-content-muted whitespace-nowrap">
        {v}
      </span>
    ),
  },
  {
    key:   'nombre_empresa',
    label: 'Cliente',
    render: (v, row) => (
      <div>
        <p className="font-semibold text-content-primary text-xs leading-none truncate uppercase">{v}</p>
        <p className="text-[10px] text-content-muted mt-0.5 truncate">{row.nombre_encargado}</p>
      </div>
    ),
  },
  {
    key:       'fecha_cotizacion',
    label:     'Fecha',
    align:     'center',
    render: (v) => (
      <span className="text-xs text-content-tertiary tabular-nums whitespace-nowrap">
        {fmtFechaCorta(v)}
      </span>
    ),
  },
  {
    key:       'fecha_vencimiento',
    label:     'Vencimiento',
    align:     'center',
    render: (v) => {
      const retrasada = estaVencida(v);
      return (
        <div className={`inline-flex items-center gap-1.5 text-xs tabular-nums whitespace-nowrap ${
          retrasada ? 'text-semantic-danger font-semibold' : 'text-content-tertiary'
        }`}>
          {retrasada && <CircleAlert size={12} />}
          {v ?? '—'}
        </div>
      );
    },
  },
  {
    key:       'total',
    label:     'Total',
    align:     'center',
    className: 'w-40',
    render: (v) => <AmountDisplay color={1} value={v} />,
  },
  {
    key:       'estado',
    label:     'Estado',
    align:     'center',
    render: (v) => <StatusBadge estado={v} size="sm" dot={false} fixedWidth />,
  },
  {
    key:       'acciones',
    label:     'Acciones',
    align:     'right',
    className: 'w-44',
    sortable:  false,
    render: (_, row) => (
      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={(e) => { e.stopPropagation(); openDrawer('EXPORT_MODAL_COTIZACIONES', row); }}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
          title="Exportar PDF"
        >
          <Download size={12} />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); exportCotizacionesExcel(row); }}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
          title="Exportar Excel"
        >
          <FileSpreadsheet size={12} />
        </button>

        {row.estado === 'Aceptada' && !row.facturas_id && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirm({
                title:     'Convertir a Factura',
                message:   `¿Convertir la cotización ${row.numero} en factura?`,
                onConfirm: async () => convertir(row.id_cotizaciones),
              });
            }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
            title="Convertir a factura"
          >
            <ArrowRight size={12} />
          </button>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); setSelected(row); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all"
          title="Ver detalle"
        >
          <Eye size={12} /> Ver
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            openConfirm({
              title:     'Eliminar Cotización',
              message:   `¿Eliminar la cotización ${row.numero}?`,
              onConfirm: async () => removeAsync(row.id_cotizaciones),
            });
          }}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-semantic-danger hover:text-white hover:border-semantic-danger transition-all active:scale-95"
          title="Eliminar"
        >
          <Trash2 size={12} />
        </button>
      </div>
    ),
  },
], [openConfirm, openDrawer, removeAsync, convertir,
  selectedIds, allVisibleSelected, someVisibleSelected,
  toggleSelected, toggleSelectAllVisible, setSelected]);

export default useCotizacionesColumns;
