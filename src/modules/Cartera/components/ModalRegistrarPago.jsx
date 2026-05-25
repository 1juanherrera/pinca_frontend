/**
 * ModalRegistrarPago
 * Drawer de registro de pago/abono sobre una factura.
 */
import { useState } from 'react';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { usePagos } from '../api/useCartera';
import Drawer from '../../../shared/Drawer';
import { Button } from '../../../shared/Button';
import { FormInput } from '../../../shared/Form/FormInput';
import { FormTextarea } from '../../../shared/Form/FormTextarea';
import FormDate from '../../../shared/Form/FormDate';
import { LABEL_BASE, LABEL_REQUIRED_MARK, FIELD_ERROR } from '../../../shared/Form/styles';
import { fmt } from '../../../utils/formatters';
import {
  getEstadoEfectivo, METODOS_PAGO, ICONO_METODO, validarPago,
} from '../services/carteraService';
import cn from '../../../utils/cn';

const RegistrarPagoContent = ({ factura, onClose }) => {
  const hoy = new Date().toISOString().split('T')[0];

  // Hooks SIEMPRE al inicio — el orden debe ser estable entre renders.
  const [form, setForm] = useState({
    monto:             '',
    tipo:              'abono',
    metodo_pago:       '',
    numero_referencia: '',
    observaciones:     '',
    fecha_pago:        hoy,
  });
  const [errors, setErrors] = useState({});
  const { registrarPagoAsync, isRegistrando } = usePagos();

  // Early return DESPUÉS de los hooks: se renderiza un drawer con mensaje y
  // los hooks de arriba quedan inutilizados pero declarados — lint OK.
  if (!factura?.id_facturas) {
    return (
      <Drawer
        isOpen onClose={onClose}
        title="Factura inválida"
        size="md"
        footer={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}
      >
        <p className="text-sm text-content-secondary">
          La factura seleccionada no tiene un ID válido.
        </p>
      </Drawer>
    );
  }

  const saldo       = Number(factura.saldo_pendiente ?? 0);
  const estado      = getEstadoEfectivo(factura);
  const isPagoTotal = form.tipo === 'pago_total';

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleTipo = (tipo) => {
    set('tipo', tipo);
    set('monto', tipo === 'pago_total' ? String(saldo) : '');
  };

  const handleSubmit = async () => {
    const { valid, errors: errs } = validarPago({
      ...form,
      facturas_id:     factura.id_facturas,
      saldo_pendiente: saldo,
    });
    if (!valid) { setErrors(errs); return; }

    const payload = {
      facturas_id:       factura.id_facturas,
      clientes_id:       factura.cliente_id,
      monto:             Number(form.monto),
      tipo:              form.tipo,
      metodo_pago:       form.metodo_pago,
      numero_referencia: form.numero_referencia || null,
      observaciones:     form.observaciones     || null,
      fecha_pago:        form.fecha_pago,
    };

    try {
      await registrarPagoAsync(payload);
      onClose();
    } catch (error) {
      if (error?.response?.data?.errors) setErrors(error.response.data.errors);
    }
  };

  return (
    <Drawer
      isOpen
      onClose={onClose}
      icon={CreditCard}
      title="Registrar pago"
      description={factura.numero}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isRegistrando}>
            Cancelar
          </Button>
          <Button variant="primary" icon={CreditCard} onClick={handleSubmit} loading={isRegistrando}>
            Confirmar pago
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Resumen */}
        <div className="bg-surface-subtle border border-border-base rounded-md p-3 space-y-1.5 text-xs">
          <div className="flex justify-between text-content-tertiary">
            <span>Total factura</span>
            <span className="font-semibold text-content-primary tabular-nums">{fmt(factura.total)}</span>
          </div>
          <div className="flex justify-between text-content-tertiary">
            <span>Saldo pendiente</span>
            <span className="font-semibold text-semantic-warning-fg tabular-nums">{fmt(saldo)}</span>
          </div>
          <div className="flex justify-between text-content-tertiary">
            <span>Estado</span>
            <span className="font-medium text-content-secondary">{estado}</span>
          </div>
        </div>

        {/* Tipo de pago */}
        <section className="space-y-2">
          <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Tipo de pago</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'abono',      label: 'Abono parcial' },
              { value: 'pago_total', label: 'Pago total'    },
            ].map(({ value, label }) => {
              const active = form.tipo === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleTipo(value)}
                  className={cn(
                    'flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium border transition-colors',
                    active
                      ? 'border-content-primary bg-content-primary text-content-inverse'
                      : 'border-border-base bg-surface-base text-content-secondary hover:border-border-strong',
                  )}
                >
                  {active && <CheckCircle2 size={12} />}
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Detalle */}
        <section className="space-y-3">
          <p className="text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Detalle del pago</p>

          <FormInput
            label="Monto" required
            type="number" min="1" step="100" placeholder="0"
            leftSymbol="$"
            value={form.monto}
            readOnly={isPagoTotal}
            onChange={(e) => set('monto', e.target.value)}
            error={errors.monto}
            className={cn(isPagoTotal && 'bg-surface-muted cursor-not-allowed')}
          />
          {!isPagoTotal && saldo > 0 && (
            <button
              type="button"
              onClick={() => set('monto', String(saldo))}
              className="text-[11px] text-semantic-info-fg hover:underline -mt-2"
            >
              Usar saldo completo ({fmt(saldo)})
            </button>
          )}

          {/* Método */}
          <div>
            <label className={LABEL_BASE}>
              Método de pago<span className={LABEL_REQUIRED_MARK}>*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {METODOS_PAGO.map((metodo) => {
                const active = form.metodo_pago === metodo;
                const Icon   = ICONO_METODO[metodo];
                return (
                  <button
                    key={metodo}
                    type="button"
                    onClick={() => set('metodo_pago', metodo)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors capitalize',
                      active
                        ? 'border-content-primary bg-content-primary text-content-inverse'
                        : 'border-border-base bg-surface-base text-content-secondary hover:border-border-strong',
                    )}
                  >
                    <Icon size={13} /> {metodo}
                  </button>
                );
              })}
            </div>
            {errors.metodo_pago && (
              <span className={FIELD_ERROR}>{errors.metodo_pago}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormDate
              label="Fecha del pago"
              required
              value={form.fecha_pago}
              onChange={(iso) => set('fecha_pago', iso)}
              error={errors.fecha_pago}
            />
            <FormInput
              label="N° referencia"
              placeholder="Ej: 00123456"
              value={form.numero_referencia}
              onChange={(e) => set('numero_referencia', e.target.value)}
            />
          </div>

          <FormTextarea
            label="Observaciones"
            rows={2}
            placeholder="Notas adicionales..."
            value={form.observaciones}
            onChange={(e) => set('observaciones', e.target.value)}
          />
        </section>
      </div>
    </Drawer>
  );
};

const ModalRegistrarPago = ({ factura, onClose }) => {
  if (!factura) return null;
  return <RegistrarPagoContent key={factura.id_facturas} factura={factura} onClose={onClose} />;
};

export default ModalRegistrarPago;
