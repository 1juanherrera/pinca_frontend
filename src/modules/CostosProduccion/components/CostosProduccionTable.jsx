import { useMemo, useState } from 'react';
import { Eye, AlertTriangle, CheckCircle2, Factory } from 'lucide-react';
import ERPTable from '../../../shared/ErpTable';
import { fmt } from '../../../utils/formatters';
import { cn } from '../../../utils/cn';

const EstadoCell = ({ estado, faltantes }) => {
  if (estado === 'completo') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-semantic-success-fg bg-semantic-success-subtle px-2 py-0.5 rounded-pill">
        <CheckCircle2 size={11} /> Listo
      </span>
    );
  }
  const n = faltantes?.length ?? 0;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-semantic-warning-fg bg-semantic-warning-subtle px-2 py-0.5 rounded-pill">
      <AlertTriangle size={11} /> Falta {n} MP{n !== 1 ? 's' : ''}
    </span>
  );
};

const CostosProduccionTable = ({
  productos,
  isLoading,
  onRowClick,
  emptyMessage    = 'Sin productos con fórmula activa',
  emptySubMessage = 'Creá una fórmula desde Formulaciones para ver su costo aquí',
}) => {
  const [sortBy, setSortBy]   = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const sorted = useMemo(() => {
    if (!sortBy) return productos;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...productos].sort((a, b) => {
      const va = a[sortBy];
      const vb = b[sortBy];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb), 'es', { numeric: true }) * dir;
    });
  }, [productos, sortBy, sortDir]);

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  };

  const columns = [
    {
      key:   'nombre',
      label: 'Producto',
      sortable: true,
      render: (v, row) => (
        <div className="min-w-0">
          <p className="text-xs font-semibold text-content-primary truncate uppercase">{v}</p>
          <p className="text-[10px] text-content-muted truncate">
            {row.codigo || '—'}
            {row.categoria_nombre && ` · ${row.categoria_nombre}`}
          </p>
        </div>
      ),
    },
    {
      key:   'estado',
      label: 'Estado',
      align: 'center',
      sortable: true,
      render: (v, row) => <EstadoCell estado={v} faltantes={row.mps_faltantes} />,
    },
    {
      key:   'volumen_base',
      label: 'Rinde',
      align: 'right',
      sortable: true,
      render: (v) => (
        <span className="text-xs tabular-nums text-content-secondary">
          {v > 0 ? (
            <>
              <span className="font-semibold">{v}</span>
              <span className="text-[10px] text-content-muted ml-0.5">gal</span>
            </>
          ) : <span className="text-content-muted">—</span>}
        </span>
      ),
    },
    {
      key:   'mps_total',
      label: 'MPs',
      align: 'center',
      sortable: true,
      render: (v) => <span className="text-xs tabular-nums text-content-tertiary">{v}</span>,
    },
    {
      key:   'tandas_posibles',
      label: 'Stock para',
      align: 'right',
      sortable: true,
      render: (v, row) => {
        const tandas = Number(v ?? 0);
        const gal    = Number(row.galones_posibles ?? 0);
        if (tandas === 0) {
          return <span className="text-xs text-semantic-danger-fg tabular-nums font-semibold">0 tandas</span>;
        }
        return (
          <div className="text-right">
            <p className={cn(
              'text-xs tabular-nums font-bold',
              tandas >= 3 ? 'text-semantic-success-fg' : tandas >= 1 ? 'text-semantic-warning-fg' : 'text-semantic-danger-fg'
            )}>
              {tandas} tanda{tandas !== 1 ? 's' : ''}
            </p>
            <p className="text-[10px] text-content-muted tabular-nums">{gal} gal</p>
          </div>
        );
      },
    },
    {
      key:   'costo_mp_por_unidad',
      label: 'Costo MP',
      align: 'right',
      sortable: true,
      render: (v) => (
        <span className="text-xs tabular-nums text-content-secondary">
          {v != null ? fmt(v) : <span className="text-content-muted">—</span>}
        </span>
      ),
    },
    {
      key:   'costo_empaque_mod',
      label: 'Empaque y MO',
      align: 'right',
      sortable: true,
      render: (v) => (
        <span className={cn(
          'text-xs tabular-nums',
          Number(v) > 0 ? 'text-brand-primary-active' : 'text-content-muted'
        )}>
          {Number(v) > 0 ? fmt(v) : '—'}
        </span>
      ),
    },
    {
      key:   'costo_total',
      label: 'Costo Total',
      align: 'right',
      sortable: true,
      render: (v) => (
        <span className="text-sm tabular-nums font-bold text-content-primary">
          {v != null ? fmt(v) : <span className="text-content-muted">—</span>}
        </span>
      ),
    },
    {
      key:   'porcentaje_utilidad',
      label: 'Margen',
      align: 'right',
      sortable: true,
      render: (v) => (
        <span className="text-xs tabular-nums text-content-tertiary">
          {Number(v).toFixed(0)}%
        </span>
      ),
    },
    {
      key:   'precio_venta_calc',
      label: 'Precio Sugerido',
      align: 'right',
      sortable: true,
      render: (v, row) => (
        <div className="text-right">
          {v != null ? (
            <span className="text-xs tabular-nums font-bold text-semantic-success-fg">{fmt(v)}</span>
          ) : (
            <span className="text-xs text-content-muted">—</span>
          )}
          {row.precio_manual_activo === 1 && row.precio_venta_manual != null && (
            <p className="text-[10px] text-content-muted mt-0.5">
              Manual: <span className="tabular-nums">{fmt(row.precio_venta_manual)}</span>
            </p>
          )}
        </div>
      ),
    },
    {
      key:   '_acciones',
      label: '',
      align: 'center',
      render: (_v, row) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRowClick?.(row); }}
          title="Ver desglose"
          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-content-muted hover:bg-surface-muted hover:text-content-primary transition"
        >
          <Eye size={13} />
        </button>
      ),
    },
  ];

  return (
    <ERPTable
      columns={columns}
      data={sorted}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      emptySubMessage={emptySubMessage}
      onRowClick={onRowClick}
      variant="cards"
      sortBy={sortBy}
      sortDir={sortDir}
      onSort={handleSort}
    />
  );
};

export default CostosProduccionTable;
