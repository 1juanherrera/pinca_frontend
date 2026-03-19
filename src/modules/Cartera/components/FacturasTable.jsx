/**
 * FacturasTable
 * Vista principal de cartera — misma estructura que FacturacionTab
 * pero con columna de mora y botón de registrar pago.
 */

import { useState, useMemo } from 'react';
import {
  CreditCard, Clock, CheckCircle2, Receipt,
  DollarSign, AlertCircle,
} from 'lucide-react';
import ERPTable            from '../../../shared/ERPTable';
import StatusBadge         from '../../../shared/StatusBadge';
import SummaryCard         from '../../../shared/SummaryCard';
import SearchFilterBar     from '../../../shared/SearchFilterBar';
import AmountDisplay       from '../../../shared/AmountDisplay';
import { fmt, formatLetterDate } from '../../../utils/formatters';
import { calcularDiasMora, getEstadoEfectivo } from '../services/carteraService';
import { useFactura } from '../../Comercial/Facturacion/api/useFactura';

const FacturasTable = ({ onRegistrarPago, onVerDetalle }) => {
  const { facturas, isLoadingFacturas } = useFactura();

  const [search,  setSearch]  = useState('');
  const [filters, setFilters] = useState({ estado: '' });

  // ── Métricas ──────────────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const list = Array.isArray(facturas) ? facturas : [];
    return {
      total:     list.length,
      pendiente: list.filter((f) => getEstadoEfectivo(f) === 'Pendiente').length,
      pagada:    list.filter((f) => getEstadoEfectivo(f) === 'Pagada').length,
      vencida:   list.filter((f) => getEstadoEfectivo(f) === 'Vencida').length,
      saldoTotal: list
        .filter((f) => getEstadoEfectivo(f) !== 'Pagada')
        .reduce((acc, f) => acc + Number(f.saldo_pendiente || 0), 0),
    };
  }, [facturas]);

  // ── Filtrado ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const list = Array.isArray(facturas) ? facturas : [];
    return list.filter((f) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        f.numero?.toLowerCase().includes(q) ||
        f.nombre_empresa?.toLowerCase().includes(q) ||
        f.nombre_encargado?.toLowerCase().includes(q);
      const estadoEfectivo = getEstadoEfectivo(f);
      const matchEstado = !filters.estado || estadoEfectivo === filters.estado;
      return matchSearch && matchEstado;
    });
  }, [facturas, search, filters]);

  // ── Columnas ──────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'numero',
      label: 'Número',
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
          {v}
        </span>
      ),
    },
    {
      key: 'cliente',
      label: 'Cliente',
      render: (_, row) => (
        <span className="text-xs font-medium text-gray-700 truncate max-w-40 block">
          {row.nombre_empresa || row.nombre_encargado || `#${row.cliente_id}`}
        </span>
      ),
    },
    {
      key: 'fecha_emision',
      label: 'Emisión',
      render: (v) => (
        <span className="text-[12px] font-semibold uppercase text-gray-600">
          {formatLetterDate(v)}
        </span>
      ),
    },
    {
      key: 'fecha_vencimiento',
      label: 'Vencimiento',
      render: (v, row) => {
        const dias = calcularDiasMora(v);
        const enMora = dias > 0 && getEstadoEfectivo(row) !== 'Pagada';
        return (
          <div className={`flex items-center gap-1.5 text-[12px] font-semibold uppercase ${enMora ? 'text-red-600' : 'text-gray-600'}`}>
            {enMora && <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
            {v ?? '—'}
          </div>
        );
      },
    },
    {
      key: 'total',
      label: 'Total',
      align: 'right',
      render: (v) => <AmountDisplay value={v} />,
    },
    {
      key: 'saldo_pendiente',
      label: 'Saldo',
      align: 'right',
      render: (v) => (
        <span className={`font-mono text-sm tabular-nums ${Number(v) > 0 ? 'text-amber-700' : 'text-emerald-600'}`}>
          {fmt(v)}
        </span>
      ),
    },
    {
      key: 'mora',
      label: 'Mora',
      align: 'center',
      render: (_, row) => {
        const dias = calcularDiasMora(row.fecha_vencimiento);
        const enMora = dias > 0 && getEstadoEfectivo(row) !== 'Pagada';
        if (!enMora) return <span className="text-gray-300 text-xs">—</span>;
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-red-700 bg-red-50 border border-red-200">
            {dias}d
          </span>
        );
      },
    },
    {
      key: 'estado',
      label: 'Estado',
      align: 'center',
      render: (_, row) => <StatusBadge estado={getEstadoEfectivo(row)} />,
    },
    {
      key: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (_, row) => {
        const pagada = getEstadoEfectivo(row) === 'Pagada';
        return (
          <div className="flex items-center justify-end gap-1">
            {!pagada && (
              <button
                onClick={(e) => { e.stopPropagation(); onRegistrarPago?.(row); }}
                title="Registrar pago"
                className="p-1.5 rounded hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Facturas"   value={metrics.total}     icon={Receipt}      color="gray"  />
        <SummaryCard label="Pendientes"        value={metrics.pendiente} icon={Clock}        color="amber" />
        <SummaryCard label="Pagadas"           value={metrics.pagada}    icon={CheckCircle2} color="green" />
        <SummaryCard
          label="Saldo por Cobrar"
          value={fmt(metrics.saldoTotal)}
          icon={DollarSign}
          color="blue"
          sub={`${metrics.vencida} vencida(s)`}
        />
      </div>

      {/* Filtros */}
      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por número o cliente..."
        filters={[
          {
            key: 'estado',
            label: 'Todos los estados',
            options: [
              { value: 'Pendiente', label: 'Pendiente' },
              { value: 'Pagada',    label: 'Pagada'    },
              { value: 'Vencida',   label: 'Vencida'   },
              { value: 'Parcial',   label: 'Parcial'   },
            ],
          },
        ]}
        values={filters}
        onChange={(key, val) => setFilters((prev) => ({ ...prev, [key]: val }))}
      />

      {/* Tabla */}
      <ERPTable
        columns={columns}
        data={filtered}
        isLoading={isLoadingFacturas}
        emptyMessage="No se encontraron facturas"
        onRowClick={(row) => onVerDetalle?.(row)}
      />
    </div>
  );
};

export default FacturasTable;