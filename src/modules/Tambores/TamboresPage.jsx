import { useState } from 'react';
import { Plus, FlaskConical, RefreshCw } from 'lucide-react';
import { useTambores, useCrearTambores } from './api/useTambores';
import TamborForm from './components/TamborForm';
import TamborDetalle from './components/TamborDetalle';
import Drawer from '../../shared/Drawer';
import { Button } from '../../shared/Button';
import ERPTable from '../../shared/ErpTable';

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
        <span className="font-mono text-sm">
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
    <div className="p-6 flex flex-col gap-5">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <FlaskConical size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-900">Tambores</h1>
            <p className="text-xs text-zinc-500">Trazabilidad de tambores de materias primas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-all"
            title="Actualizar"
          >
            <RefreshCw size={16} />
          </button>
          <Button variant="blue" onClick={() => setFormOpen(true)}>
            <Plus size={15} />
            Nuevo Tambor
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por nº tambor o material..."
          value={filters.search}
          onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          className="px-3 py-2 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 w-64"
        />
        <select
          value={filters.estado}
          onChange={(e) => setFilters(f => ({ ...f, estado: e.target.value }))}
          className="px-3 py-2 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {ESTADO_OPTS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {(filters.search || filters.estado) && (
          <button
            onClick={() => setFilters({ search: '', estado: '' })}
            className="text-xs text-zinc-400 hover:text-zinc-700 underline"
          >
            Limpiar filtros
          </button>
        )}
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
