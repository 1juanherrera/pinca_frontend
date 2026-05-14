/**
 * NotasCreditoDrawer
 * Panel lateral de notas crédito de una factura.
 * Consume: GET/POST /notas_credito  PATCH /notas_credito/{id}/anular
 * Patrón B (detalle): DetailDrawer con formulario inline.
 */

import { useState } from 'react';
import { FileMinus, Plus, XCircle, AlertCircle, Download } from 'lucide-react';
import { useNotasCredito } from '../api/useCartera';
import { useBoundStore }   from '../../../store/useBoundStore';
import DetailDrawer  from '../../../shared/DetailDrawer';
import StatusBadge   from '../../../shared/StatusBadge';
import AmountDisplay from '../../../shared/AmountDisplay';
import { Button }    from '../../../shared/Button';
import { fmt }       from '../../../utils/formatters';

// ── Fila de nota crédito ──────────────────────────────────────
const NotaRow = ({ nota, onAnular, numeroFactura }) => {
  const anulada = nota.estado === 'Anulada';
  const openDrawer = useBoundStore((s) => s.openDrawer);
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${anulada ? 'bg-surface-subtle border-border-subtle opacity-60' : 'bg-semantic-danger-subtle border-semantic-danger/15'}`}>
      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${anulada ? 'bg-surface-strong' : 'bg-semantic-danger-subtle'}`}>
        <FileMinus className={`w-4 h-4 ${anulada ? 'text-content-muted' : 'text-semantic-danger-fg'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className=" text-xs font-semibold text-content-primary">{nota.numero}</span>
          <StatusBadge estado={nota.estado} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[11px] text-content-tertiary">{nota.fecha} · {nota.motivo}</span>
          <span className={`text-sm font-bold  tabular-nums ${anulada ? 'text-content-muted line-through' : 'text-semantic-danger-fg'}`}>
            - {fmt(nota.monto)}
          </span>
        </div>
      </div>
      <button
        onClick={() => openDrawer('EXPORT_MODAL_NC', { ...nota, factura_numero: numeroFactura })}
        title="Descargar PDF"
        className="shrink-0 p-1 rounded text-content-muted hover:text-content-primary hover:bg-surface-muted transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
      {!anulada && (
        <button
          onClick={() => onAnular(nota.id_nota_credito)}
          title="Anular nota crédito"
          className="shrink-0 p-1 rounded text-content-muted hover:text-semantic-danger hover:bg-semantic-danger-subtle transition-colors"
        >
          <XCircle className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

// ── Formulario inline para nueva nota ────────────────────────
const NuevaNotaForm = ({ facturaId, clienteId, saldoPendiente, onCreada }) => {
  const { crearNotaAsync, isCreando } = useNotasCredito(facturaId, clienteId);
  const [form, setForm] = useState({ monto: '', motivo: '', fecha: new Date().toISOString().split('T')[0] });
  const [error, setError] = useState('');

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setError(''); };

  const handleSubmit = async () => {
    if (!form.monto || Number(form.monto) <= 0) { setError('El monto debe ser mayor a cero'); return; }
    if (Number(form.monto) > Number(saldoPendiente)) { setError(`Supera el saldo (${fmt(saldoPendiente)})`); return; }
    if (!form.motivo) { setError('El motivo es requerido'); return; }

    await crearNotaAsync({
      facturas_id: facturaId,
      clientes_id: clienteId,
      fecha:       form.fecha,
      monto:       Number(form.monto),
      motivo:      form.motivo,
    });
    setForm({ monto: '', motivo: '', fecha: new Date().toISOString().split('T')[0] });
    onCreada?.();
  };

  return (
    <div className="space-y-3 p-4 bg-semantic-danger-subtle border border-semantic-danger/15 rounded-xl">
      <p className="text-xs font-semibold text-semantic-danger-fg uppercase tracking-wide">Nueva nota crédito</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-content-tertiary mb-1">Monto *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-content-muted">$</span>
            <input
              type="number"
              min="1"
              value={form.monto}
              onChange={(e) => set('monto', e.target.value)}
              placeholder="0"
              className="w-full text-sm border border-border-base rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-content-tertiary mb-1">Fecha *</label>
          <input
            type="date"
            value={form.fecha}
            onChange={(e) => set('fecha', e.target.value)}
            className="w-full text-sm border border-border-base rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-content-tertiary mb-1">Motivo *</label>
        <input
          type="text"
          value={form.motivo}
          onChange={(e) => set('motivo', e.target.value)}
          placeholder="Ej: Devolución 2 galones por defecto de color"
          className="w-full text-sm border border-border-base rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
      </div>

      {error && (
        <p className="flex items-center gap-1 text-xs text-semantic-danger-fg">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}

      <Button variant="black" icon={Plus} onClick={handleSubmit} disabled={isCreando}>
        {isCreando ? 'Creando...' : 'Crear nota crédito'}
      </Button>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────
const NotasCreditoDrawer = ({ facturaId, clienteId, numeroFactura, saldoPendiente, isOpen, onClose }) => {
  const { notas, isLoadingNotas, anularNota } = useNotasCredito(facturaId, clienteId);
  const openConfirm  = useBoundStore((s) => s.openConfirm);
  const [mostrarForm, setMostrarForm] = useState(false);

  const handleAnular = (id) => {
    openConfirm({
      title:     'Anular nota crédito',
      message:   'Esta acción revertirá el efecto de la nota sobre el saldo de la factura. ¿Continuar?',
      onConfirm: () => anularNota(id),
    });
  };

  const totalActivas = notas
    .filter((n) => n.estado === 'Activa')
    .reduce((acc, n) => acc + Number(n.monto), 0);

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Notas crédito"
      subtitle={numeroFactura ? `Factura ${numeroFactura}` : ''}
      width="md"
    >
      {/* Totalizador */}
      {!isLoadingNotas && notas.length > 0 && (
        <div className="px-5 py-3 bg-semantic-danger-subtle border-b border-semantic-danger/15 flex items-center justify-between">
          <span className="text-xs text-semantic-danger-fg font-semibold">Total notas activas</span>
          <span className="text-sm font-bold text-semantic-danger-fg ">- {fmt(totalActivas)}</span>
        </div>
      )}

      {/* Botón agregar */}
      <div className="px-5 py-3 border-b border-border-subtle">
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="flex items-center gap-2 text-xs font-semibold text-semantic-danger-fg hover:text-semantic-danger-fg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {mostrarForm ? 'Cancelar' : 'Nueva nota crédito'}
        </button>
      </div>

      {/* Formulario inline */}
      {mostrarForm && (
        <div className="px-5 pt-4">
          <NuevaNotaForm
            facturaId={facturaId}
            clienteId={clienteId}
            saldoPendiente={saldoPendiente}
            onCreada={() => setMostrarForm(false)}
          />
        </div>
      )}

      {/* Lista */}
      <div className="px-5 py-4 flex flex-col gap-2">
        {isLoadingNotas ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-muted rounded-lg animate-pulse" />
          ))
        ) : notas.length > 0 ? (
          notas.map((n) => (
            <NotaRow key={n.id_nota_credito} nota={n} onAnular={handleAnular} numeroFactura={numeroFactura} />
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-content-muted">
            <FileMinus className="w-8 h-8 opacity-30" />
            <p className="text-xs font-medium text-center">Sin notas crédito registradas</p>
          </div>
        )}
      </div>
    </DetailDrawer>
  );
};

export default NotasCreditoDrawer;