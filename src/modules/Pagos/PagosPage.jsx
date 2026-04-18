import { useState, useMemo } from 'react';
import {
  Wallet, Plus, TrendingUp, CreditCard,
  Banknote, Eye, Trash2,
} from 'lucide-react';
import { useBoundStore } from '../../store/useBoundStore';
import HeaderSection from '../../shared/HeaderSection';
import { Button } from '../../shared/Button';
import ConfirmModal from '../../shared/ConfirmModal';
import ERPTable from '../../shared/ERPTable';
import StatusBadge from '../../shared/StatusBadge';
import SummaryCard from '../../shared/SummaryCard';
import SearchFilterBar from '../../shared/SearchFilterBar';
import AmountDisplay from '../../shared/AmountDisplay';
import PagoForm from './components/PagoForm';
import PagoDrawer from './components/PagoDrawer';
import { usePagos } from './api/usePago';
import { fmt } from '../../utils/formatters';

// Mapa de ícono por método de pago
const MetodoBadge = ({ metodo }) => {
  const MAP = {
    nequi:         { label: 'Nequi',         bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-100'  },
    daviplata:     { label: 'Daviplata',      bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-100'   },
    transferencia: { label: 'Transferencia',  bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-100'  },
    efectivo:      { label: 'Efectivo',       bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
    cheque:        { label: 'Cheque',         bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-100' },
  };
  const s = MAP[metodo?.toLowerCase()] ?? { label: metodo, bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200' };
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded border ${s.bg} ${s.text} ${s.border}`}>
      {s.label}
    </span>
  );
};

const PagosPage = () => {
  const { pagos, isLoadingPagos, removeAsync } = usePagos();
  const { openDrawer, openConfirm } = useBoundStore();

  const [search, setSearch]   = useState('');
  const [filters, setFilters] = useState({ tipo: '', metodo_pago: '' });
  const [selected, setSelected] = useState(null);

  // ── Métricas ──────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const list = Array.isArray(pagos) ? pagos : [];
    const total = list.reduce((acc, p) => acc + Number(p.monto || 0), 0);
    const abonos     = list.filter((p) => p.tipo === 'abono').length;
    const anticipos  = list.filter((p) => p.tipo === 'anticipo').length;
    const pagosTotal = list.filter((p) => p.tipo === 'pago_total').length;
    return { count: list.length, total, abonos, anticipos, pagosTotal };
  }, [pagos]);

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const list = Array.isArray(pagos) ? pagos : [];
    return list.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.numero_referencia?.toLowerCase().includes(q) ||
        p.nombre_empresa?.toLowerCase().includes(q) ||
        p.nombre_encargado?.toLowerCase().includes(q);
      const matchTipo   = !filters.tipo        || p.tipo        === filters.tipo;
      const matchMetodo = !filters.metodo_pago || p.metodo_pago === filters.metodo_pago;
      return matchSearch && matchTipo && matchMetodo;
    });
  }, [pagos, search, filters]);

  // ── Columnas ──────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'numero_referencia',
      label: 'Referencia',
      render: (v) => (
        <span className=" text-xs font-bold text-zinc-400 whitespace-nowrap">
          {v}
        </span>
      ),
    },
    {
      key: 'nombre_empresa',
      label: 'Cliente',
      render: (v, row) => (
        <div className="min-w-0">
          <p className="font-semibold text-zinc-800 text-xs leading-none truncate uppercase">{v}</p>
          <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{row.nombre_encargado}</p>
        </div>
      ),
    },
    {
      key: 'fecha_pago',
      label: 'Fecha',
      render: (v) => <span className="text-xs text-zinc-500 tabular-nums whitespace-nowrap">{v}</span>,
    },
    {
      key: 'metodo_pago',
      label: 'Método',
      render: (v) => <MetodoBadge metodo={v} />,
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (v) => <StatusBadge estado={v} />,
    },
    {
      key: 'monto',
      label: 'Monto',
      align: 'right',
      render: (v) => <AmountDisplay value={v} color />,
    },
    {
      key: 'acciones',
      label: '',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(row); }}
            title="Ver detalle"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all"
          >
            <Eye size={12} /> Ver
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openConfirm({
                title: 'Eliminar Pago',
                message: `¿Eliminar el pago ${row.numero_referencia}?`,
                onConfirm: async () => removeAsync(row.id_pagos_cliente),
              });
            }}
            title="Eliminar"
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all active:scale-95"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col w-full gap-4">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title="Pagos de Clientes"
          subtitle="Facturación"
          description="Registro de abonos, anticipos y pagos totales"
          icon={Wallet}
          breadcrumbs={[
            { label: 'Facturación' },
            { label: 'Pagos', path: '/pagos_cliente' },
          ]}
        />
        <Button variant="black" onClick={() => openDrawer('PAGO_FORM')} icon={Plus}>
          Registrar Pago
        </Button>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Pagos"     value={metrics.count}      icon={CreditCard}  color="gray"   />
        <SummaryCard label="Abonos"           value={metrics.abonos}     icon={Banknote}    color="blue"   />
        <SummaryCard label="Anticipos"        value={metrics.anticipos}  icon={TrendingUp}  color="violet" />
        <SummaryCard label="Recaudado Total"  value={fmt(metrics.total)} icon={Wallet}      color="green"  />
      </div>

      {/* ── Filtros ── */}
      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por referencia, empresa o encargado..."
        filters={[
          {
            key: 'tipo',
            label: 'Todos los tipos',
            options: [
              { value: 'abono',      label: 'Abono'      },
              { value: 'anticipo',   label: 'Anticipo'   },
              { value: 'pago_total', label: 'Pago Total' },
            ],
          },
          {
            key: 'metodo_pago',
            label: 'Todos los métodos',
            options: [
              { value: 'efectivo',      label: 'Efectivo'      },
              { value: 'transferencia', label: 'Transferencia' },
              { value: 'nequi',         label: 'Nequi'         },
              { value: 'daviplata',     label: 'Daviplata'     },
              { value: 'cheque',        label: 'Cheque'        },
            ],
          },
        ]}
        values={filters}
        onChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
      />

      {/* ── Tabla ── */}
      <ERPTable
        columns={columns}
        data={filtered}
        isLoading={isLoadingPagos}
        emptyMessage="No se encontraron pagos"
        onRowClick={(row) => setSelected(row)}
      />

      {/* ── Modales ── */}
      <PagoDrawer
        pago={selected}
        isOpen={!!selected}
        onClose={() => setSelected(null)}
      />
      <PagoForm />
      <ConfirmModal />
    </div>
  );
};

export default PagosPage;