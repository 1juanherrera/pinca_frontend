import { useState, useMemo } from 'react';
import { FileDigit, Plus, Edit, Save, X, AlertTriangle, Calendar, Hash } from 'lucide-react';
import { Button } from '../../../shared/Button';
import StatusBadge from '../../../shared/StatusBadge';
import IconBox from '../../../shared/IconBox';
import EmptyState from '../../../shared/EmptyState';
import Modal from '../../../shared/Modal';
import { useBoundStore } from '../../../store/useBoundStore';
import { useNumeraciones, useUpdateNumeracion, useCreateNumeracion } from '../api/useNumeracion';

const TIPO_LABEL = {
  factura:      'Factura de venta',
  cotizacion:   'Cotización',
  remision:     'Remisión',
  orden_compra: 'Orden de compra',
  nota_credito: 'Nota crédito',
};

const computeEstado = (s) => {
  const hoy = new Date().toISOString().slice(0, 10);
  if (s.fecha_vigencia_hasta && s.fecha_vigencia_hasta < hoy) {
    return { tone: 'danger',  label: 'Vencida' };
  }
  if (s.rango_max != null && s.folios_restantes !== null) {
    if (s.folios_restantes === 0)        return { tone: 'danger',  label: 'Agotada' };
    if (s.folios_restantes <= 50)        return { tone: 'warning', label: 'Por vencer' };
  }
  return { tone: 'success', label: 'Vigente' };
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO') : '—';

// ── Modal: editar / crear serie ─────────────────────────────────────────────
const SerieModal = ({ serie, tipoFijo = null, onClose }) => {
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
              <label className="block text-[11px] font-semibold text-content-secondary mb-1.5">Fecha resolución</label>
              <input
                type="date"
                value={form.fecha_resolucion}
                onChange={(e) => setField('fecha_resolucion', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
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
            <div>
              <label className="block text-[11px] font-semibold text-content-secondary mb-1.5">Vigencia hasta</label>
              <input
                type="date"
                value={form.fecha_vigencia_hasta}
                onChange={(e) => setField('fecha_vigencia_hasta', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
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

// ── Tab principal ────────────────────────────────────────────────────────────
const NumeracionTab = () => {
  const user    = useBoundStore((s) => s.user);
  const esAdmin = user?.rol === 'admin';

  const { data: series = [], isLoading } = useNumeraciones();
  const [editando, setEditando] = useState(null);
  const [creando,  setCreando]  = useState(false);

  const seriesActivas = useMemo(() => series.filter((s) => Number(s.activo) === 1), [series]);
  const inactivas     = useMemo(() => series.filter((s) => Number(s.activo) !== 1), [series]);

  if (isLoading) {
    return (
      <div className="bg-surface-base border border-border-base rounded-xl shadow-card p-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-surface-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-surface-base border border-border-base rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-border-subtle">
        <IconBox icon={FileDigit} tone="info" variant="subtle" size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-content-primary">Numeración correlativa</h3>
          <p className="text-xs text-content-tertiary mt-0.5">
            Cada documento usa la serie activa de su tipo. Cuando una resolución DIAN se acerca al límite, cargá una nueva serie.
          </p>
        </div>
        {esAdmin && (
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setCreando(true)}>
            Nueva serie
          </Button>
        )}
      </div>

      {/* Tabla series activas */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-surface-muted border-b border-border-base">
            <tr>
              {['Documento', 'Próximo n°', 'Resolución DIAN', 'Vigencia', 'Folios', 'Estado', ''].map((h, i) => (
                <th key={h} className={`px-3 py-2 text-[10px] font-semibold text-content-tertiary uppercase tracking-wider ${i >= 1 && i <= 4 ? 'text-center' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {seriesActivas.map((s) => {
              const estado = computeEstado(s);
              return (
                <tr key={s.id_numeracion} className="hover:bg-surface-subtle">
                  <td className="px-3 py-2.5">
                    <p className="text-xs font-semibold text-content-primary">{TIPO_LABEL[s.tipo_doc] ?? s.tipo_doc}</p>
                    <p className="text-[10px] font-mono text-content-tertiary mt-0.5">{s.prefijo}</p>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <p className="text-xs font-mono font-bold text-content-primary tabular-nums">{s.ejemplo_proximo}</p>
                    <p className="text-[10px] text-content-muted">#{s.proximo_numero}</p>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {s.resolucion_dian ? (
                      <p className="text-xs font-mono text-content-secondary">{s.resolucion_dian}</p>
                    ) : (
                      <span className="text-[10px] text-content-muted italic">Sin resolución</span>
                    )}
                    {s.fecha_resolucion && (
                      <p className="text-[10px] text-content-muted">{fmtDate(s.fecha_resolucion)}</p>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-xs text-content-secondary inline-flex items-center gap-1">
                      <Calendar size={10} />
                      {fmtDate(s.fecha_vigencia_hasta)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {s.folios_restantes !== null ? (
                      <span className={`text-xs font-bold tabular-nums ${
                        s.folios_restantes === 0 ? 'text-semantic-danger-fg'
                        : s.folios_restantes <= 50 ? 'text-semantic-warning-fg'
                        : 'text-content-secondary'
                      }`}>
                        {s.folios_restantes.toLocaleString('es-CO')}
                      </span>
                    ) : (
                      <span className="text-[10px] text-content-muted">∞</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <StatusBadge tone={estado.tone} label={estado.label} dot={false} size="sm" fixedWidth />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {esAdmin && (
                      <button
                        onClick={() => setEditando(s)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-white hover:border-content-primary transition-all"
                        title="Editar serie"
                      >
                        <Edit size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Inactivas (colapsadas) */}
      {inactivas.length > 0 && (
        <details className="group border-t border-border-subtle">
          <summary className="cursor-pointer px-5 py-3 text-xs font-semibold text-content-tertiary hover:bg-surface-subtle flex items-center justify-between">
            <span>Series inactivas ({inactivas.length})</span>
            <Hash size={12} className="text-content-muted group-open:rotate-90 transition-transform" />
          </summary>
          <div className="overflow-x-auto bg-surface-subtle/40">
            <table className="w-full">
              <tbody className="divide-y divide-border-subtle">
                {inactivas.map((s) => (
                  <tr key={s.id_numeracion}>
                    <td className="px-5 py-2 text-xs">
                      <span className="font-semibold text-content-secondary">{TIPO_LABEL[s.tipo_doc]}</span>
                      <span className="ml-2 font-mono text-content-tertiary">{s.prefijo}</span>
                      <span className="ml-2 text-content-muted">#{s.proximo_numero}</span>
                      {s.resolucion_dian && (
                        <span className="ml-2 font-mono text-[10px] text-content-tertiary">DIAN {s.resolucion_dian}</span>
                      )}
                    </td>
                    <td className="px-5 py-2 text-right">
                      {esAdmin && (
                        <button
                          onClick={() => setEditando(s)}
                          className="text-[10px] font-semibold text-content-tertiary hover:text-content-primary"
                        >
                          Reactivar / Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {seriesActivas.length === 0 && (
        <div className="py-8">
          <EmptyState icon={FileDigit} title="Sin series activas" description="Creá una serie para empezar a numerar documentos." size="sm" />
        </div>
      )}

      {/* Modales */}
      {editando && <SerieModal serie={editando} onClose={() => setEditando(null)} />}
      {creando  && <SerieModal serie={null}     onClose={() => setCreando(false)} />}
    </div>
  );
};

export default NumeracionTab;
