/**
 * GestionesCobroDrawer
 * Panel lateral de gestiones de cobro de una factura.
 * Consume: GET/POST/DELETE /gestiones_cobro?factura_id=X
 * Patrón A (formulario inline) dentro de Patrón B (DetailDrawer).
 */

import { useState } from 'react';
import { Phone, Mail, MapPin, MessageCircle, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useGestionesCobro } from '../api/useCartera';
import { useBoundStore }     from '../../../store/useBoundStore';
import DetailDrawer from '../../../shared/DetailDrawer';
import { Button }   from '../../../shared/Button';
import FormDate     from '../../../shared/Form/FormDate';

// ── Ícono por tipo ────────────────────────────────────────────
const ICONO_TIPO = {
  llamada:  Phone,
  email:    Mail,
  visita:   MapPin,
  whatsapp: MessageCircle,
};

const TIPOS = ['llamada', 'email', 'visita', 'whatsapp'];

// ── Fila de gestión ───────────────────────────────────────────
const GestionRow = ({ gestion, onEliminar }) => {
  const Icon = ICONO_TIPO[gestion.tipo] ?? Phone;
  return (
    <div className="flex items-start gap-3 p-3 bg-surface-subtle rounded-lg border border-border-subtle">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-white border border-border-base flex items-center justify-center shadow-sm">
        <Icon className="w-4 h-4 text-content-tertiary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-content-primary capitalize">{gestion.tipo}</span>
          <span className="text-[11px] text-content-muted">{gestion.creado_en?.split(' ')[0]}</span>
        </div>
        {gestion.resultado && (
          <p className="text-[11px] text-content-secondary mt-0.5 leading-relaxed">{gestion.resultado}</p>
        )}
        {gestion.proxima_gestion && (
          <p className="text-[11px] text-semantic-info-fg mt-1 font-medium">
            Próximo seguimiento: {gestion.proxima_gestion}
          </p>
        )}
      </div>
      <button
        onClick={() => onEliminar(gestion.id_gestion)}
        className="shrink-0 p-1 rounded text-content-muted hover:text-semantic-danger hover:bg-semantic-danger-subtle transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ── Formulario inline para nueva gestión ─────────────────────
const NuevaGestionForm = ({ facturaId, clienteId, onCreado }) => {
  const { crearGestionAsync, isCreando } = useGestionesCobro(facturaId, clienteId);
  const [form, setForm] = useState({
    tipo: 'llamada', resultado: '', proxima_gestion: '',
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.tipo) return;
    await crearGestionAsync({
      facturas_id:    facturaId,
      clientes_id:    clienteId,
      tipo:           form.tipo,
      resultado:      form.resultado   || null,
      proxima_gestion: form.proxima_gestion || null,
    });
    setForm({ tipo: 'llamada', resultado: '', proxima_gestion: '' });
    onCreado?.();
  };

  return (
    <div className="space-y-3 p-4 bg-semantic-info-subtle border border-semantic-info/15 rounded-xl">
      <p className="text-xs font-semibold text-semantic-info-fg uppercase tracking-wide">Nueva gestión</p>

      {/* Tipo */}
      <div className="grid grid-cols-2 gap-2">
        {TIPOS.map((t) => {
          const Icon = ICONO_TIPO[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => set('tipo', t)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all capitalize
                ${form.tipo === t
                  ? 'border-content-primary bg-content-primary text-content-inverse'
                  : 'border-border-base bg-white text-content-secondary hover:border-border-strong'
                }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t}
            </button>
          );
        })}
      </div>

      {/* Resultado */}
      <div>
        <label className="block text-xs text-content-tertiary mb-1">Resultado / Nota</label>
        <textarea
          rows={2}
          value={form.resultado}
          onChange={(e) => set('resultado', e.target.value)}
          placeholder="¿Qué pasó en esta gestión?"
          className="w-full text-sm border border-border-base rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-border-focus/15 resize-none"
        />
      </div>

      {/* Próxima gestión */}
      <div>
        <FormDate
          label="Próximo seguimiento"
          value={form.proxima_gestion}
          onChange={(iso) => set('proxima_gestion', iso)}
        />
      </div>

      <Button variant="black" icon={Plus} onClick={handleSubmit} disabled={isCreando}>
        {isCreando ? 'Guardando...' : 'Registrar gestión'}
      </Button>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────
const GestionesCobroDrawer = ({ facturaId, clienteId, numeroFactura, isOpen, onClose }) => {
  const { gestiones, isLoadingGestiones, eliminarGestion } = useGestionesCobro(facturaId, clienteId);
  const openConfirm = useBoundStore((s) => s.openConfirm);
  const [mostrarForm, setMostrarForm] = useState(false);

  const handleEliminar = (id) => {
    openConfirm({
      title:     'Eliminar gestión',
      message:   '¿Estás seguro de que deseas eliminar esta gestión de cobro?',
      onConfirm: () => eliminarGestion(id),
    });
  };

  return (
    <DetailDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Gestiones de cobro"
      subtitle={numeroFactura ? `Factura ${numeroFactura}` : ''}
      width="md"
    >
      {/* Botón agregar */}
      <div className="px-5 py-3 border-b border-border-subtle">
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="flex items-center gap-2 text-xs font-semibold text-semantic-info-fg hover:text-semantic-info transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {mostrarForm ? 'Cancelar' : 'Nueva gestión'}
        </button>
      </div>

      {/* Formulario inline */}
      {mostrarForm && (
        <div className="px-5 pt-4">
          <NuevaGestionForm
            facturaId={facturaId}
            clienteId={clienteId}
            onCreado={() => setMostrarForm(false)}
          />
        </div>
      )}

      {/* Lista */}
      <div className="px-5 py-4 flex flex-col gap-2">
        {isLoadingGestiones ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-surface-muted rounded-lg animate-pulse" />
          ))
        ) : gestiones.length > 0 ? (
          gestiones.map((g) => (
            <GestionRow key={g.id_gestion} gestion={g} onEliminar={handleEliminar} />
          ))
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-content-muted">
            <Phone className="w-8 h-8 opacity-30" />
            <p className="text-xs font-medium text-center">Sin gestiones registradas</p>
          </div>
        )}
      </div>
    </DetailDrawer>
  );
};

export default GestionesCobroDrawer;