/**
 * HistorialPagos
 * Panel lateral con historial de pagos de un cliente.
 * Patrón idéntico a FacturaDrawer: DetailDrawer + isOpen/onClose/title/subtitle.
 */

import { Banknote } from 'lucide-react';
import { usePagosCliente } from '../api/useCartera';
import DetailDrawer  from '../../../shared/DetailDrawer';
import AmountDisplay from '../../../shared/AmountDisplay';
import { fmt }       from '../../../utils/formatters';
import { ICONO_METODO } from '../services/carteraService';

// ── Sub-sección con título — igual que Section en FacturaDrawer ───────────
const Section = ({ title, icon: Icon, children }) => (
  <div className="px-5 py-4 border-b border-gray-100 last:border-b-0">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-gray-400" />
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

// ── Fila de pago ──────────────────────────────────────────────────────────
const PagoRow = ({ pago }) => {
  const isAbono = pago.tipo === 'abono';
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="shrink-0 w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
        {(() => { const Icon = ICONO_METODO[pago.metodo_pago] ?? Banknote; return <Icon className="w-4 h-4 text-gray-500" />; })()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-gray-800 truncate">
            {pago.metodo_pago ?? 'Pago'}
          </span>
          <AmountDisplay value={pago.monto} color />
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[11px] text-gray-400">{pago.fecha_pago}</span>
          {pago.numero_referencia && (
            <span className="text-[11px] text-gray-400 font-mono">· {pago.numero_referencia}</span>
          )}
          <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${
            isAbono ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            {isAbono ? 'Abono' : 'Total'}
          </span>
        </div>
        {pago.observaciones && (
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{pago.observaciones}</p>
        )}
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────
const HistorialPagos = ({ clienteId, clienteNombre, isOpen, onClose }) => {
  const { pagosCliente, isLoadingPagosCliente } = usePagosCliente(clienteId);

  const totalPagado = pagosCliente.reduce((acc, p) => acc + Number(p.monto ?? 0), 0);

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Historial de pagos"
      subtitle={clienteNombre ?? ''}
      width="md"
    >
      {isLoadingPagosCliente ? (
        <div className="p-5 space-y-3">
          {[90, 75, 88, 68, 72].map((w, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : pagosCliente.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-10 text-gray-400">
          <Banknote className="w-8 h-8" />
          <span className="text-sm">Sin pagos registrados</span>
        </div>
      ) : (
        <>
          {/* Totalizador — mismo estilo que cabecera de estado en FacturaDrawer */}
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total recaudado</p>
              <p className="text-xl font-bold text-gray-900 font-mono tabular-nums">{fmt(totalPagado)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Transacciones</p>
              <p className="text-xl font-bold text-gray-900">{pagosCliente.length}</p>
            </div>
          </div>

          {/* Lista de pagos */}
          <Section title="Pagos registrados" icon={Banknote}>
            <div className="space-y-2">
              {pagosCliente.map((pago) => (
                <PagoRow key={pago.id_pagos_cliente} pago={pago} />
              ))}
            </div>
          </Section>
        </>
      )}
    </DetailDrawer>
  );
};

export default HistorialPagos;