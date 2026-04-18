import { useState } from 'react';
import { Plus, FlaskConical, RefreshCw } from 'lucide-react';
import { useTambores, useCrearTambores } from './api/useTambores';
import TamborForm from './components/TamborForm';
import TamborDetalle from './components/TamborDetalle';
import Drawer from '../../shared/Drawer';
import { Button, ButtonSquare } from '../../shared/Button';
import ERPTable from '../../shared/ErpTable';
import HeaderSection from '../../shared/HeaderSection';
import SearchFilterBar from '../../shared/SearchFilterBar';

export const ESTADO_TAMBOR = {
  0: { label: 'Cerrado',  bg: 'bg-zinc-100',    text: 'text-zinc-600',    dot: 'bg-zinc-400'    },
  1: { label: 'Abierto',  bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  2: { label: 'Vacío',    bg: 'bg-zinc-200',    text: 'text-zinc-400',    dot: 'bg-zinc-300'    },
};

const ESTADO_OPTS = [
  { value: '', label: 'Todos los estados' },
  { value: '0', label: 'Cerrado' },
  { value: '1', label: 'Abierto' },
  { value: '2', label: 'Vacío' },
];

const TamboresPage = () => {
  const [filters, setFilters] = useState({ search: '', estado: '' });
  const [formOpen, setFormOpen]       = useState(false);
  const [selectedId, setSelectedId]   = useState(null);

  const { data: result, isLoading, refetch } = useTambores(filters);
  const tambores = result?.data ?? result ?? [];

  const crearMutation = useCrearTambores();

  const handleSubmit = (formData) => {
    crearMutation.mutate(formData, {
      onSuccess: () => setFormOpen(false),
    });
  };

  const columns = [
    { key: 'numero_tambor', label: 'Nº Tambor', sortable: true },
    { key: 'material',      label: 'Material',  sortable: true },
    { key: 'bodega',        label: 'Ubicación', sortable: true },
    {
      key: 'cantidad_actual',
      label: 'Cant. Actual',
      render: (value, row) => (
        <span className=" text-sm">
          {value} / {row.cantidad_inicial}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => {
        const e = ESTADO_TAMBOR[value] ?? ESTADO_TAMBOR[0];
        return (
          <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-semibold uppercase ${e.bg} ${e.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${e.dot}`} />
            {e.label}
          </span>
        );
      },
    },
    { key: 'fecha_ingreso', label: 'Fecha Ingreso' },
  ];

  return (
    <div className="flex flex-col w-full gap-4">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title="Tambores"
          subtitle="Inventario"
          description="Trazabilidad de tambores de materias primas"
          icon={FlaskConical}
          breadcrumbs={[
            { label: 'Inventario' },
            { label: 'Tambores', path: '/tambores' },
          ]}
        />
        <div className="flex items-center gap-2">
          <ButtonSquare
            icon={RefreshCw}
            onClick={() => refetch()}
            sizeIcon={18}
            title="Actualizar datos"
            variant="white"
          />
          <Button variant="black" icon={Plus} onClick={() => setFormOpen(true)}>
            Nuevo Tambor
          </Button>
        </div>
      </div>

      <div className="bg-white border border-zinc-100 rounded-2xl px-5 py-4 shadow-sm">
        <SearchFilterBar
          search={filters.search}
          onSearch={(v) => setFilters(f => ({ ...f, search: v }))}
          placeholder="Buscar por nº tambor o material..."
          values={filters}
          onChange={(key, val) => setFilters(f => ({ ...f, [key]: val }))}
          statusKey="estado"
          statusOptions={ESTADO_OPTS.filter(o => o.value !== '')}
          allLabel="Todos los estados"
        />
      </div>

      {/* Tabla */}
      <ERPTable
        columns={columns}
        data={tambores}
        isLoading={isLoading}
        emptyMessage="No hay tambores registrados"
        emptySubMessage="Usa el botón «Nuevo Tambor» para ingresar la lista de materias primas"
        EmptyIcon={FlaskConical}
        onRowClick={(row) => setSelectedId(row.id_tambor)}
      />

      {/* Drawer — nuevo tambor */}
      <Drawer
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title="Registrar Tambores"
        description="Ingresa uno o varios números de tambor para la misma materia prima"
      >
        <TamborForm
          onSubmit={handleSubmit}
          isLoading={crearMutation.isPending}
          onCancel={() => setFormOpen(false)}
        />
      </Drawer>

      {/* Drawer — detalle tambor */}
      <Drawer
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
        title="Detalle del Tambor"
        description="Historial de movimientos y estado actual"
      >
        {selectedId && <TamborDetalle tamborId={selectedId} />}
      </Drawer>
    </div>
  );
};

export default TamboresPage;
