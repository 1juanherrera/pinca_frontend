/**
 * ModalRegistrarPago
 * Drawer de registro de pago/abono sobre una factura.
 * Patrón idéntico a FacturaForm:
 *   - overlay fixed inset-0 bg-black/30
 *   - panel fixed top-0 right-0 h-full con header / body / footer
 *   - wrapper externo decide si montar el contenido
 *   - key en CarteraPage resetea el estado sin useEffect
 */

import { useState } from 'react';
import { X, CreditCard, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePagos } from '../api/useCartera';
import { Button }   from '../../../shared/Button';
import { fmt }      from '../../../utils/formatters';
import {
  getEstadoEfectivo,
  METODOS_PAGO,
  ICONO_METODO,
  validarPago,
} from '../services/carteraService';

// ── Field con label + error ───────────────────────────────────────────────
const Field = ({ label, error, children }) => (
  <div className="flex flex-col gap-1">
    <label className="block text-xs text-gray-500 mb-1">{label}</label>
    {children}
    {error && (
      <span className="flex items-center gap-1 text-xs text-red-600 mt-0.5">
        <AlertCircle className="w-3 h-3" /> {error}
      </span>
    )}
  </div>
);

const inputCls = (error) =>
  `w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900
   ${error ? 'border-red-400' : 'border-gray-200'}`;

// ── Contenido ─────────────────────────────────────────────────────────────
const RegistrarPagoContent = ({ factura, onClose }) => {
  const hoy = new Date().toISOString().split('T')[0];

  // Verificar que la factura tenga los campos necesarios
  if (!factura?.id_facturas) {
    console.error('Factura inválida:', factura);
    return (
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px] flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
          <h3 className="text-lg font-bold text-red-600 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">La factura seleccionada no tiene un ID válido.</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const [form, setForm]     = useState({
    monto:             '',
    tipo:              'abono',
    metodo_pago:       '',
    numero_referencia: '',
    observaciones:     '',
    fecha_pago:        hoy,
  });
  const [errors, setErrors] = useState({});

  const { registrarPagoAsync, isRegistrando } = usePagos();

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
    console.log('Iniciando registro de pago...'); // Debug
    
    const { valid, errors: errs } = validarPago({
      ...form,
      facturas_id:     factura.id_facturas,
      saldo_pendiente: saldo,
    });
    
    console.log('Resultado validación:', { valid, errors: errs }); // Debug
    
    if (!valid) { 
      setErrors(errs); 
      console.log('Errores de validación:', errs); // Debug
      return; 
    }

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

    console.log('Payload enviado:', payload); // Debug

    try {
      await registrarPagoAsync(payload);
      console.log('Pago registrado exitosamente'); // Debug
      onClose();
    } catch (error) {
      console.error('Error al registrar pago:', error); // Debug
      
      // Mostrar errores específicos si el servidor los devuelve
      if (error?.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        setErrors(serverErrors);
      }
    }
  };

  return (
    <>
      {/* Overlay — igual que FacturaForm */}
      <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-[1px]" onClick={onClose} />

      {/* Panel lateral — igual que FacturaForm */}
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Registrar pago</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">{factura.numero}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Resumen de la factura */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Total factura</span>
              <span className="font-mono font-semibold text-gray-800">{fmt(factura.total)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Saldo pendiente</span>
              <span className="font-mono font-bold text-amber-700">{fmt(saldo)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Estado</span>
              <span className="font-semibold text-gray-700">{estado}</span>
            </div>
          </div>

          {/* Tipo de pago */}
          <fieldset className="space-y-2">
            <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-1">Tipo de pago</legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'abono',      label: 'Abono parcial' },
                { value: 'pago_total', label: 'Pago total'    },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleTipo(value)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all
                    ${form.tipo === value
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                    }`}
                >
                  {form.tipo === value && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Monto */}
          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-1">Detalle del pago</legend>

            <Field label="Monto *" error={errors.monto}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">$</span>
                <input
                  type="number"
                  min="1"
                  step="100"
                  placeholder="0"
                  value={form.monto}
                  readOnly={isPagoTotal}
                  onChange={(e) => set('monto', e.target.value)}
                  className={`${inputCls(errors.monto)} pl-7 ${isPagoTotal ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                />
              </div>
              {!isPagoTotal && saldo > 0 && (
                <button
                  type="button"
                  onClick={() => set('monto', String(saldo))}
                  className="self-start text-[11px] text-blue-600 hover:underline"
                >
                  Usar saldo completo ({fmt(saldo)})
                </button>
              )}
            </Field>

            {/* Método de pago */}
            <Field label="Método de pago *" error={errors.metodo_pago}>
              <div className="grid grid-cols-2 gap-2">
                {METODOS_PAGO.map((metodo) => (
                  <button
                    key={metodo}
                    type="button"
                    onClick={() => set('metodo_pago', metodo)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all
                      ${form.metodo_pago === metodo
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                      }`}
                  >
                    {(() => { const Icon = ICONO_METODO[metodo]; return <Icon className="w-3.5 h-3.5" />; })()} {metodo}
                  </button>
                ))}
              </div>
            </Field>

            {/* Fecha + referencia */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha del pago *" error={errors.fecha_pago}>
                <input
                  type="date"
                  value={form.fecha_pago}
                  onChange={(e) => set('fecha_pago', e.target.value)}
                  className={inputCls(errors.fecha_pago)}
                />
              </Field>
              <Field label="N° referencia">
                <input
                  type="text"
                  placeholder="Ej: 00123456"
                  value={form.numero_referencia}
                  onChange={(e) => set('numero_referencia', e.target.value)}
                  className={inputCls(false)}
                />
              </Field>
            </div>

            {/* Observaciones */}
            <Field label="Observaciones">
              <textarea
                rows={2}
                placeholder="Notas adicionales..."
                value={form.observaciones}
                onChange={(e) => set('observaciones', e.target.value)}
                className={`${inputCls(false)} resize-none`}
              />
            </Field>
          </fieldset>
        </div>

        {/* Footer — igual que FacturaForm */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isRegistrando}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <Button
            variant="black"
            icon={CreditCard}
            onClick={handleSubmit}
            disabled={isRegistrando}
          >
            {isRegistrando ? 'Registrando...' : 'Confirmar pago'}
          </Button>
        </div>
      </div>
    </>
  );
};

// ── Wrapper — decide si montar el contenido (patrón FacturaForm) ──────────
const ModalRegistrarPago = ({ factura, onClose }) => {
  if (!factura) return null;

  return (
    <RegistrarPagoContent
      key={factura.id_facturas}
      factura={factura}
      onClose={onClose}
    />
  );
};

export default ModalRegistrarPago;