import { useMemo, useState } from 'react';
import { Plus, Users, Pencil, Archive, Search } from 'lucide-react';
import ErpTable from '../../../shared/ErpTable';
import { Button } from '../../../shared/Button';
import StatusBadge from '../../../shared/StatusBadge';
import { useBoundStore } from '../../../store/useBoundStore';
import { fmt } from '../../../utils/formatters';
import { useEmpleados } from '../api/useNomina';

const EmpleadosTab = () => {
  const { empleados, isLoading, remove } = useEmpleados();
  const openDrawer  = useBoundStore((s) => s.openDrawer);
  const openConfirm = useBoundStore((s) => s.openConfirm);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return empleados;
    return empleados.filter((e) =>
      `${e.nombre} ${e.documento} ${e.cargo ?? ''}`.toLowerCase().includes(t),
    );
  }, [empleados, q]);

  const columns = [
    { key: 'nombre', label: 'Empleado', render: (v, r) => (
        <div className="min-w-0">
          <p className="font-semibold text-content-primary truncate">{v}</p>
          <p className="text-[11px] text-content-tertiary">{r.documento}</p>
        </div>
    ) },
    { key: 'cargo', label: 'Cargo', render: (v) => v || <span className="text-content-muted">—</span> },
    { key: 'salario_base', label: 'Salario base', align: 'right', render: (v) => (
        <span className="font-semibold tabular-nums">{fmt(v)}</span>
    ) },
    { key: 'activo', label: 'Estado', align: 'center', render: (v) => (
        <StatusBadge estado={Number(v) === 1 ? 'Activo' : 'Inactivo'}
          tone={Number(v) === 1 ? 'success' : 'neutral'} size="sm" dot fixedWidth />
    ) },
    { key: '__acciones', label: '', align: 'right', render: (_v, r) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => openDrawer('NOMINA_EMPLEADO_FORM', r)}
            className="p-1.5 rounded-lg text-content-tertiary hover:text-content-primary hover:bg-surface-muted transition-colors"
            title="Editar"
          ><Pencil size={15} /></button>
          <button
            onClick={() => openConfirm({
              title: 'Archivar empleado',
              message: `¿Archivar a ${r.nombre}? No aparecerá en nuevas liquidaciones.`,
              variant: 'danger',
              onConfirm: () => remove(r.id),
            })}
            className="p-1.5 rounded-lg text-content-tertiary hover:text-semantic-danger hover:bg-semantic-danger-subtle transition-colors"
            title="Archivar"
          ><Archive size={15} /></button>
        </div>
    ) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, documento o cargo…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-border-base rounded-xl bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
        <Button variant="primary" size="sm" icon={Plus} onClick={() => openDrawer('NOMINA_EMPLEADO_FORM')}>
          Nuevo empleado
        </Button>
      </div>

      <div className="bg-surface-base border border-border-subtle rounded-2xl shadow-sm p-2">
        <ErpTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          EmptyIcon={Users}
          emptyMessage="No hay empleados registrados"
          variant="cards"
        />
      </div>
    </div>
  );
};

export default EmpleadosTab;
