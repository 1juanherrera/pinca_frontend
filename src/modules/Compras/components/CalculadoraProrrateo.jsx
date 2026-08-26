import { useState, useMemo } from 'react';
import { Calculator, Plus, Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import Modal from '../../../shared/Modal';
import { Button } from '../../../shared/Button';
import ErpTable from '../../../shared/ErpTable';
import { fmt, parsePesoColombiano } from '../../../utils/formatters';

/**
 * Calculadora de prorrateo PRE-OC (simulación).
 *
 * Permite simular cómo se distribuiría un precio total negociado entre N líneas
 * ANTES de crear una orden de compra. Es pura simulación client-side:
 * no llama a ningún endpoint, no persiste nada, no toca inventario.
 *
 * Mismo algoritmo que el backend:
 *   factor = precio_total_pagado / Σ(cantidad × precio_lista)
 *   costo_prorrateado_unitario = precio_lista × factor
 */

const lineaVacia = () => ({
  id: crypto.randomUUID?.() ?? String(Math.random()),
  descripcion: '',
  cantidad: '',
  precioLista: '',
});

const CalculadoraProrrateo = ({ isOpen, onClose }) => {
  const [lineas, setLineas] = useState([lineaVacia(), lineaVacia()]);
  const [precioTotal, setPrecioTotal] = useState('');

  const updateLinea = (id, campo, valor) => {
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)));
  };

  const addLinea = () => setLineas((prev) => [...prev, lineaVacia()]);

  const removeLinea = (id) =>
    setLineas((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));

  const reset = () => {
    setLineas([lineaVacia(), lineaVacia()]);
    setPrecioTotal('');
  };

  const precioNum = parsePesoColombiano(precioTotal) || 0;

  const totalLista = useMemo(
    () =>
      lineas.reduce((sum, l) => {
        const cant = Number(l.cantidad) || 0;
        const precio = parsePesoColombiano(l.precioLista) || 0;
        return sum + cant * precio;
      }, 0),
    [lineas],
  );

  const sinBase = totalLista <= 0;
  const factor = sinBase ? 0 : precioNum / totalLista;
  const diferencia = precioNum - totalLista;

  const columns = useMemo(() => [
    {
      key: 'descripcion', label: 'Descripción', sortable: false,
      render: (v, l) => (
        <input
          type="text"
          value={v}
          onChange={(e) => updateLinea(l.id, 'descripcion', e.target.value)}
          placeholder="Descripción del ítem"
          className="w-full px-2 py-1.5 bg-surface-base border border-border-base rounded-lg focus:outline-none focus:border-border-focus text-content-primary"
        />
      ),
    },
    {
      key: 'cantidad', label: 'Cantidad', align: 'right', className: 'w-28', sortable: false,
      render: (v, l) => (
        <input
          type="number"
          min="0"
          value={v}
          onChange={(e) => updateLinea(l.id, 'cantidad', e.target.value)}
          placeholder="0"
          className="w-24 px-2 py-1.5 text-right tabular-nums bg-surface-base border border-border-base rounded-lg focus:outline-none focus:border-border-focus text-content-primary"
        />
      ),
    },
    {
      key: 'precioLista', label: 'Precio lista unit.', align: 'right', className: 'w-40', sortable: false,
      render: (v, l) => (
        <input
          type="text"
          inputMode="numeric"
          value={v}
          onChange={(e) => updateLinea(l.id, 'precioLista', e.target.value)}
          placeholder="$ 0"
          className="w-36 px-2 py-1.5 text-right tabular-nums bg-surface-base border border-border-base rounded-lg focus:outline-none focus:border-border-focus text-content-primary"
        />
      ),
    },
    {
      key: '__subtotalLista', label: 'Subtotal lista', align: 'right', className: 'w-36', sortable: false,
      render: (_v, l) => {
        const subtotalLista = (Number(l.cantidad) || 0) * (parsePesoColombiano(l.precioLista) || 0);
        return <span className="tabular-nums text-content-secondary">{subtotalLista > 0 ? fmt(subtotalLista) : <span className="text-content-muted">—</span>}</span>;
      },
    },
    {
      key: '__costoProrrUnit', label: 'Costo prorr. unit.', align: 'right', className: 'w-40', sortable: false,
      render: (_v, l) => {
        const precio = parsePesoColombiano(l.precioLista) || 0;
        const costoProrrUnit = precio * factor;
        return <span className="tabular-nums text-content-secondary">{costoProrrUnit > 0 ? fmt(costoProrrUnit) : <span className="text-content-muted">—</span>}</span>;
      },
    },
    {
      key: '__subtotalProrr', label: 'Subtotal prorr.', align: 'right', className: 'w-36', sortable: false,
      render: (_v, l) => {
        const precio = parsePesoColombiano(l.precioLista) || 0;
        const cant = Number(l.cantidad) || 0;
        const subtotalProrr = precio * factor * cant;
        return <span className="tabular-nums font-medium text-content-primary">{subtotalProrr > 0 ? fmt(subtotalProrr) : <span className="text-content-muted">—</span>}</span>;
      },
    },
    {
      key: '__actions', label: '', align: 'center', className: 'w-12', sortable: false,
      render: (_v, l) => (
        <button
          type="button"
          onClick={() => removeLinea(l.id)}
          disabled={lineas.length <= 1}
          title="Quitar línea"
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-content-tertiary hover:bg-semantic-danger-subtle hover:text-semantic-danger-fg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 size={13} />
        </button>
      ),
    },
  ], [factor, lineas.length]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simular prorrateo"
      icon={Calculator}
      size="2xl"
      description="Simulá cómo se reparte un precio negociado entre las líneas, antes de crear la orden de compra"
    >
      <div className="flex flex-col gap-5">
        {/* Precio total pagado */}
        <div className="bg-surface-subtle border border-border-base rounded-xl p-4">
          <label className="block text-sm font-medium text-content-secondary mb-2">
            Precio total pagado (negociado)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={precioTotal}
            onChange={(e) => setPrecioTotal(e.target.value)}
            placeholder="$ 0"
            className="w-full px-4 py-2.5 text-lg font-semibold tabular-nums bg-surface-base border border-border-base rounded-lg focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-border-focus/15 text-content-primary"
          />
        </div>

        {/* Tabla de líneas */}
        <div className="border border-border-base rounded-xl overflow-hidden">
          <ErpTable columns={columns} data={lineas} density="compact" borderless />
        </div>

        <div>
          <Button variant="secondary" size="sm" icon={Plus} onClick={addLinea}>
            Agregar línea
          </Button>
        </div>

        {/* Aviso división por cero */}
        {precioNum > 0 && sinBase && (
          <div className="flex items-center gap-2 text-sm text-semantic-warning-fg bg-semantic-warning-subtle border border-semantic-warning/30 rounded-xl px-4 py-3">
            <AlertCircle size={15} />
            <span>Ingresá cantidades y precios de lista para calcular el factor de prorrateo.</span>
          </div>
        )}

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-subtle border border-border-base rounded-xl p-4">
            <p className="text-xs text-content-tertiary uppercase tracking-wider mb-1">Total lista</p>
            <p className="text-lg font-semibold tabular-nums text-content-primary">{fmt(totalLista)}</p>
          </div>
          <div className="bg-surface-subtle border border-border-base rounded-xl p-4">
            <p className="text-xs text-content-tertiary uppercase tracking-wider mb-1">Factor</p>
            <p className="text-lg font-semibold tabular-nums text-content-primary">
              {sinBase ? '0.0000' : factor.toFixed(4)}
            </p>
          </div>
          <div className="bg-surface-subtle border border-border-base rounded-xl p-4">
            <p className="text-xs text-content-tertiary uppercase tracking-wider mb-1">
              {diferencia >= 0 ? 'Sobrecosto' : 'Ahorro'}
            </p>
            <p
              className={`text-lg font-semibold tabular-nums ${
                diferencia >= 0 ? 'text-semantic-danger-fg' : 'text-semantic-success-fg'
              }`}
            >
              {fmt(Math.abs(diferencia))}
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border-base">
          <Button variant="ghost" icon={RotateCcw} onClick={reset}>
            Limpiar
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CalculadoraProrrateo;
