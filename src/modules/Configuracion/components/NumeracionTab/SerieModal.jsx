import { useState } from 'react';
import { FileDigit, Save, AlertTriangle } from 'lucide-react';
import { Button } from '../../../../shared/Button';
import Modal from '../../../../shared/Modal';
import FormDate from '../../../../shared/Form/FormDate';
import { useUpdateNumeracion, useCreateNumeracion } from '../../api/useNumeracion';
import { TIPO_LABEL } from './constants';

// ── Modal: editar / crear serie ─────────────────────────────────────────────
export const SerieModal = ({ serie, tipoFijo = null, onClose }) => {
  const isEdit = !!serie;
  const { mutate: actualizar, isPending: isUpdating } = useUpdateNumeracion();
  const { mutate: crear,      isPending: isCreating } = useCreateNumeracion();

  const [form, setForm] = useState({
    tipo_doc:             serie?.tipo_doc             ?? tipoFijo ?? 'factura',
    prefijo:              serie?.prefijo              ?? 'FAC-{Y}-',
    padding:              serie?.padding              ?? 4,
    proximo_numero:       serie?.proximo_numero       ?? 1,
    reinicia_anual:       serie?.reinicia_anual       ?? 1,
    resolucion_dian:      serie?.resolucion_dian      ?? '',
    fecha_resolucion:     serie?.fecha_resolucion     ?? '',
    rango_min:            serie?.rango_min            ?? '',
    rango_max:            serie?.rango_max            ?? '',
    fecha_vigencia_hasta: serie?.fecha_vigencia_hasta ?? '',
    activo:               serie?.activo               ?? 1,
  });

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    const payload = {
      ...form,
      padding:        Number(form.padding),
      proximo_numero: Number(form.proximo_numero),
      reinicia_anual: Number(form.reinicia_anual),
      activo:         Number(form.activo),
      rango_min:      form.rango_min === '' ? null : Number(form.rango_min),
      rango_max:      form.rango_max === '' ? null : Number(form.rango_max),
      resolucion_dian:      form.resolucion_dian      || null,
      fecha_resolucion:     form.fecha_resolucion     || null,
      fecha_vigencia_hasta: form.fecha_vigencia_hasta || null,
    };

    if (isEdit) actualizar({ id: serie.id_numeracion, data: payload }, { onSuccess: onClose });
    else        crear(payload, { onSuccess: onClose });
  };

  const isSaving = isUpdating || isCreating;

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      title={isEdit ? `Editar serie · ${TIPO_LABEL[serie.tipo_doc] ?? serie.tipo_doc}` : 'Nueva serie / resolución DIAN'}
      icon={FileDigit}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button variant="primary" icon={Save} onClick={handleSave} loading={isSaving}>
            {isEdit ? 'Guardar cambios' : 'Crear serie'}
          </Button>
        </>
      }
    >
      <div className="space-y-4 p-1">
        {!isEdit && (
          <div>
            <label className="block text-[11px] font-semibold text-content-secondary mb-1.5">Tipo de documento</label>
            <select
              value={form.tipo_doc}
              onChange={(e) => setField('tipo_doc', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              {Object.entries(TIPO_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-content-secondary mb-1.5">Prefijo</label>
            <input
              type="text"
              value={form.prefijo}
              onChange={(e) => setField('prefijo', e.target.value)}
              placeholder="FAC-{Y}-"
              className="w-full px-3 py-2 text-sm border border-border-base rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
            <p className="text-[10px] text-content-muted mt-1">Usá <code className="bg-surface-muted px-1 rounded">{'{Y}'}</code> para insertar el año actual.</p>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-content-secondary mb-1.5">Dígitos del consecutivo</label>
            <input
              type="number" min="1" max="10"
              value={form.padding}
              onChange={(e) => setField('padding', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-base rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-content-secondary mb-1.5">Próximo número</label>
            <input
              type="number" min="1"
              value={form.proximo_numero}
              onChange={(e) => setField('proximo_numero', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border-base rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!form.reinicia_anual}
                onChange={(e) => setField('reinicia_anual', e.target.checked ? 1 : 0)}
                className="w-4 h-4 rounded border-border-strong accent-content-primary"
              />
              <span className="text-xs text-content-secondary">Reiniciar consecutivo cada año</span>
            </label>
          </div>
        </div>

        <div className="border-t border-border-subtle pt-3 space-y-3">
          <p className="text-[11px] font-semibold text-content-tertiary uppercase tracking-wider">
            Resolución DIAN <span className="font-normal normal-case">(opcional)</span>
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-content-secondary mb-1.5">N° resolución</label>
              <input
                type="text"
                value={form.resolucion_dian}
                onChange={(e) => setField('resolucion_dian', e.target.value)}
                placeholder="18760000001"
                className="w-full px-3 py-2 text-sm border border-border-base rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <div>
              <FormDate
                label="Fecha resolución"
                value={form.fecha_resolucion}
                onChange={(iso) => setField('fecha_resolucion', iso)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-content-secondary mb-1.5">Rango mín.</label>
              <input
                type="number" min="0"
                value={form.rango_min}
                onChange={(e) => setField('rango_min', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border-base rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-content-secondary mb-1.5">Rango máx.</label>
              <input
                type="number" min="0"
                value={form.rango_max}
                onChange={(e) => setField('rango_max', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border-base rounded-lg tabular-nums focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <FormDate
              label="Vigencia hasta"
              value={form.fecha_vigencia_hasta}
              onChange={(iso) => setField('fecha_vigencia_hasta', iso)}
            />
          </div>
        </div>

        {!isEdit && (
          <div className="flex items-start gap-2 rounded-lg bg-semantic-info-subtle/60 border border-semantic-info/15 px-3 py-2">
            <AlertTriangle size={13} className="text-semantic-info-fg mt-0.5 shrink-0" />
            <p className="text-[11px] text-semantic-info-fg leading-snug">
              Al crear la serie como activa, la serie anterior del mismo tipo se desactiva automáticamente. El consecutivo arranca desde el "Próximo número" indicado.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SerieModal;
