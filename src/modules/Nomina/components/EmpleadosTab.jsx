import { useMemo, useState } from 'react';
import { Plus, Users, Pencil, Archive, MinusCircle } from 'lucide-react';
import ERPTable from '../../../shared/ErpTable';
import TableShell from '../../../shared/TableShell';
import SearchFilterBar from '../../../shared/SearchFilterBar';
import { Button } from '../../../shared/Button';
import StatusBadge from '../../../shared/StatusBadge';
import useClientPagination from '../../../hooks/useClientPagination';
import { useBoundStore } from '../../../store/useBoundStore';
import { fmt } from '../../../utils/formatters';
import { useEmpleados } from '../api/useNomina';
import DescuentosDrawer from './DescuentosDrawer';

const STATUS_OPTIONS = [
  { value: '1', label: 'Activo',   dot: 'bg-semantic-success' },
  { value: '0', label: 'Inactivo', dot: 'bg-content-muted'    },
];

const EmpleadosTab = () => {
  const { empleados, isLoading, remove } = useEmpleados();
  const openDrawer  = useBoundStore((s) => s.openDrawer);
  const openConfirm = useBoundStore((s) => s.openConfirm);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ activo: '' });
  const [descuentosEmpleado, setDescuentosEmpleado] = useState(null);

  const filtered = useMemo(() => {
    const t = search.trim().toLowerCase();
    return empleados.filter((e) => {
      if (filters.activo !== '' && String(e.activo) !== filters.activo) return false;
      if (!t) return true;
      return `${e.nombre} ${e.documento} ${e.cargo ?? ''}`.toLowerCase().includes(t);
    });
  }, [empleados, search, filters.activo]);

  const pagination = useClientPagination(filtered, 20);
  const onFilterChange = (key, val) => setFilters((prev) => ({ ...prev, [key]: val }));

  const columns = [
    { key: 'nombre', label: 'Empleado', render: (v, r) => (
        <div className="min-w-0">
          <p className="font-semibold text-content-primary text-xs truncate">{v}</p>
          <p className="text-[10px] text-content-muted mt-0.5">{r.documento}</p>
        </div>
    ) },
    { key: 'cargo', label: 'Cargo', render: (v) => (
        <span className="text-xs text-content-tertiary">{v || '—'}</span>
    ) },
    { key: 'salario_base', label: 'Salario base', align: 'right', className: 'w-36', render: (v) => (
        <span className="text-xs font-semibold tabular-nums">{fmt(v)}</span>
    ) },
    { key: 'activo', label: 'Estado', align: 'center', className: 'w-28', render: (v) => (
        <StatusBadge estado={Number(v) === 1 ? 'Activo' : 'Inactivo'}
          tone={Number(v) === 1 ? 'success' : 'neutral'} size="sm" dot fixedWidth />
    ) },
    { key: '__acciones', label: 'Acciones', align: 'right', className: 'w-32', sortable: false, render: (_v, r) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setDescuentosEmpleado(r); }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
            title="Descuentos"
          ><MinusCircle size={12} /></button>
          <button
            onClick={(e) => { e.stopPropagation(); openDrawer('NOMINA_EMPLEADO_FORM', r); }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all active:scale-95"
            title="Editar"
          ><Pencil size={12} /></button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirm({
                title: 'Archivar empleado',
                message: `¿Archivar a ${r.nombre}? No aparecerá en nuevas liquidaciones.`,
                variant: 'danger',
                onConfirm: () => remove(r.id),
              });
            }}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-semantic-danger hover:text-white hover:border-semantic-danger transition-all active:scale-95"
            title="Archivar"
          ><Archive size={12} /></button>
        </div>
    ) },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end">
        <Button variant="primary" size="sm" icon={Plus} onClick={() => openDrawer('NOMINA_EMPLEADO_FORM')}>
          Nuevo empleado
        </Button>
      </div>

      <TableShell
        header={
          <SearchFilterBar
            search={search}
            onSearch={setSearch}
            placeholder="Buscar por nombre, documento o cargo..."
            values={filters}
            onChange={onFilterChange}
            statusOptions={STATUS_OPTIONS}
            statusKey="activo"
          />
        }
        pagination={pagination}
        isLoading={isLoading}
      >
        <ERPTable
          columns={columns}
          data={pagination.paginated}
          isLoading={isLoading}
          variant="default"
          borderless
          EmptyIcon={Users}
          emptyMessage="No hay empleados registrados"
          emptySubMessage="Cuando crees un empleado, aparecerá acá."
          emptyAction={
            <Button variant="primary" size="sm" icon={Plus} onClick={() => openDrawer('NOMINA_EMPLEADO_FORM')}>
              Nuevo empleado
            </Button>
          }
        />
      </TableShell>

      <DescuentosDrawer
        isOpen={!!descuentosEmpleado}
        onClose={() => setDescuentosEmpleado(null)}
        empleado={descuentosEmpleado}
      />
    </div>
  );
};

export default EmpleadosTab;
