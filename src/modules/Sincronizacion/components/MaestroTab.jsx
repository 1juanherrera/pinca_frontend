import { useMemo, useState } from 'react';
import { Users, Package, FileSpreadsheet, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';
import StatusBadge from '../../../shared/StatusBadge';
import ErpTable from '../../../shared/ErpTable';
import SearchFilterBar from '../../../shared/SearchFilterBar';
import { Button } from '../../../shared/Button';
import { fmt } from '../../../utils/formatters';
import { useSincMaestro } from '../api/useSincronizacion';
import MaestroDetailDrawer from './MaestroDetailDrawer';

const TIPO_LABEL = { 1: 'Materia Prima', 2: 'Insumo' };
const TIPO_TONE  = { 1: 'warning', 2: 'neutral' };

const fmtCOP = (v) => v == null ? '—' : fmt(v);
const fmtNum = (v, dec = 2) =>
  Number(v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec });

const MaestroTab = () => {
  const [search, setSearch]       = useState('');
  const [cobertura, setCobertura] = useState('');
  const [selected, setSelected]   = useState(null);

  const filters = useMemo(
    () => ({ search: search.trim() || undefined, cobertura: cobertura || undefined }),
    [search, cobertura],
  );
  const { data: items = [], isLoading } = useSincMaestro(filters);

  const exportExcel = () => {
    const rows = items.map((it) => ({
      'Código':           it.codigo,
      'Nombre':           it.nombre,
      'Tipo':             TIPO_LABEL[it.tipo] ?? '—',
      'Categoría':        it.categoria_nombre ?? '',
      'Stock (kg)':       it.stock_total,
      'Costo unit.':      it.costo_unitario,
      'Proveedores':      it.proveedores_count,
      'Mejor $/kg':       it.precio_min_kg ?? '',
      'Peor $/kg':        it.precio_max_kg ?? '',
      'Spread %':         it.spread_pct ?? 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Maestro');
    XLSX.writeFile(wb, `sincronizacion_maestro_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const columns = [
    {
      key: 'codigo', label: 'Código',
      render: (v) => <span className="font-mono text-[11px] text-content-secondary">{v ?? '—'}</span>,
    },
    {
      key: 'nombre', label: 'Nombre',
      render: (v, row) => (
        <div className="min-w-0">
          <p className="font-medium text-content-primary truncate">{v}</p>
          {row.categoria_nombre && (
            <p className="text-[10px] text-content-tertiary mt-0.5 truncate">{row.categoria_nombre}</p>
          )}
        </div>
      ),
    },
    {
      key: 'tipo', label: 'Tipo', align: 'center',
      render: (v) => (
        <StatusBadge
          tone={TIPO_TONE[v] ?? 'neutral'}
          label={TIPO_LABEL[v] ?? '—'}
          dot={false} size="sm" fixedWidth
        />
      ),
    },
    {
      key: 'stock_total', label: 'Stock', align: 'right',
      render: (v) => (
        <span className="tabular-nums text-content-primary">
          {v > 0 ? `${fmtNum(v)} kg` : '—'}
        </span>
      ),
    },
    {
      key: 'proveedores_count', label: 'Prov.', align: 'center',
      render: (v) => (
        <StatusBadge
          tone={v === 0 ? 'danger' : v === 1 ? 'warning' : 'success'}
          label={String(v)}
          icon={Users}
          dot={false} size="sm"
        />
      ),
    },
    {
      key: 'precio_min_kg', label: 'Mejor $/kg', align: 'right',
      render: (v) => v != null
        ? <span className="tabular-nums text-content-primary">{fmtCOP(v)}</span>
        : <span className="text-content-muted">—</span>,
    },
    {
      key: 'spread_pct', label: 'Spread', align: 'right',
      render: (v, row) => {
        if (!row.proveedores_count || row.proveedores_count < 2) {
          return <span className="text-content-muted">—</span>;
        }
        if (v > 20) {
          return <StatusBadge tone="warning" label={`+${v}%`} dot={false} size="sm" />;
        }
        return <span className="text-xs text-content-tertiary tabular-nums">+{v}%</span>;
      },
    },
    {
      key: '__action', label: '', align: 'center', sortable: false,
      render: () => (
        <span className="inline-flex items-center text-content-muted group-hover:text-brand-primary-active transition-colors">
          <Eye size={14} />
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-content-tertiary">
            {items.length} ítem{items.length === 1 ? '' : 's'}
          </p>
          <Button
            variant="secondary" size="sm" icon={FileSpreadsheet}
            onClick={exportExcel} disabled={!items.length}
          >
            Exportar
          </Button>
        </div>

        <SearchFilterBar
          search={search}
          onSearch={setSearch}
          placeholder="Buscar MP por código o nombre..."
          statusKey="cobertura"
          statusOptions={[
            { value: 'sin',     label: 'Sin proveedor', dot: 'bg-semantic-danger' },
            { value: 'uno',     label: '1 proveedor',   dot: 'bg-semantic-warning' },
            { value: 'dos_mas', label: '2+ proveedores', dot: 'bg-semantic-success' },
          ]}
          values={{ cobertura }}
          onChange={(_, v) => setCobertura(v)}
        />

        <ErpTable
          columns={columns}
          data={items.map((r) => ({ ...r, id: r.id_item_general }))}
          isLoading={isLoading}
          variant="cards"
          onRowClick={(row) => setSelected(row)}
          EmptyIcon={Package}
          emptyMessage="No hay materias primas que coincidan"
          emptySubMessage="Probá ajustar la búsqueda o el filtro de cobertura."
        />
      </div>

      {selected && (
        <MaestroDetailDrawer
          item={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
};

export default MaestroTab;
