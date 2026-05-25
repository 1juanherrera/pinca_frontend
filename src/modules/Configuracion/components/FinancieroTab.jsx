import { useMemo, useState } from 'react';
import { Save, RotateCcw, TrendingUp, FileText, BellRing, DollarSign } from 'lucide-react';
import { Button } from '../../../shared/Button';
import IconBox from '../../../shared/IconBox';
import { useConfiguracion, useBulkUpdateConfig } from '../api/useConfiguracion';
import { useBoundStore } from '../../../store/useBoundStore';

// Cada sección lee de un grupo distinto pero la mutación es bulk (una sola tabla).
const SECCIONES = [
  {
    id: 'utilidad', titulo: 'Utilidad', icon: TrendingUp, tone: 'success', grupo: 'financiero',
    descripcion: 'Margen de utilidad por defecto cuando un producto no tiene uno explícito.',
    campos: [
      {
        clave: 'margen_utilidad_default_pct', label: 'Margen de utilidad default', sufijo: '%',
        min: 0, max: 500, step: 0.5,
        hint: 'Aplicado en cálculo de costos y precio sugerido cuando `costos_item.porcentaje_utilidad` es NULL.',
      },
    ],
  },
  {
    id: 'comercial', titulo: 'Comercial', icon: FileText, tone: 'info', grupo: 'comercial',
    descripcion: 'Plazos por default al crear documentos y clientes.',
    campos: [
      {
        clave: 'dias_vencimiento_factura', label: 'Vencimiento de factura', sufijo: 'días',
        min: 0, max: 365, step: 1,
        hint: 'Plazo entre emisión y vencimiento al convertir cotización → factura.',
      },
      {
        clave: 'dias_credito_default', label: 'Plazo crédito cliente', sufijo: 'días',
        min: 0, max: 365, step: 1,
        hint: 'Sugerido al crear un cliente nuevo (campo `plazo_pago`).',
      },
    ],
  },
  {
    id: 'alertas', titulo: 'Alertas de cartera', icon: BellRing, tone: 'warning', grupo: 'notificaciones',
    descripcion: 'Anticipación con la que se avisan vencimientos próximos.',
    campos: [
      {
        clave: 'dias_alerta_vencimiento', label: 'Días previo vencimiento', sufijo: 'días',
        min: 0, max: 60, step: 1,
        hint: 'Cuántos días antes de la fecha de vencimiento empezar a notificar.',
      },
    ],
  },
];

const FinancieroTab = () => {
  const user    = useBoundStore((s) => s.user);
  const esAdmin = user?.rol === 'admin';

  const { data: all, isLoading } = useConfiguracion();
  const { mutate: bulkUpdate, isPending: isSaving } = useBulkUpdateConfig();

  const originales = useMemo(() => {
    if (!all) return {};
    const next = {};
    SECCIONES.forEach((sec) => {
      const grupo = all[sec.grupo] ?? {};
      sec.campos.forEach((c) => { next[c.clave] = grupo[c.clave]?.valor ?? ''; });
    });
    return next;
  }, [all]);

  const [overrides, setOverrides] = useState({});
  const valores = useMemo(() => ({ ...originales, ...overrides }), [originales, overrides]);

  const dirty = useMemo(
    () => Object.keys(overrides).some((k) => overrides[k] !== originales[k]),
    [overrides, originales]
  );
  const handleChange = (clave, raw) =>
    setOverrides((p) => ({ ...p, [clave]: raw === '' ? '' : Number(raw) }));
  const handleSave  = () => {
    if (dirty && esAdmin) bulkUpdate(valores, { onSuccess: () => setOverrides({}) });
  };
  const handleReset = () => setOverrides({});

  if (isLoading) {
    return (
      <div className="bg-surface-base border border-border-base rounded-xl shadow-card p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-surface-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-surface-base border border-border-base rounded-xl shadow-card overflow-hidden">
      <div className="flex items-start gap-3 px-5 py-4 border-b border-border-subtle">
        <IconBox icon={DollarSign} tone="success" variant="subtle" size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-content-primary">Financiero & Comercial</h3>
          <p className="text-xs text-content-tertiary mt-0.5">
            Defaults que afectan el costeo de productos, los plazos comerciales y las alertas de cartera.
          </p>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {SECCIONES.map((sec) => (
          <div key={sec.id} className="rounded-xl border border-border-subtle bg-surface-subtle/40 overflow-hidden">
            <div className="flex items-start gap-2.5 px-4 py-3 bg-surface-base border-b border-border-subtle">
              <IconBox icon={sec.icon} tone={sec.tone} variant="subtle" size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-content-primary">{sec.titulo}</p>
                <p className="text-[10px] text-content-tertiary mt-0.5">{sec.descripcion}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {sec.campos.map(({ clave, label, sufijo, min, max, step, hint }) => (
                <div key={clave} className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-content-secondary">{label}</label>
                  <div className="relative">
                    <input
                      type="number" min={min} max={max} step={step}
                      value={valores[clave] ?? ''}
                      disabled={!esAdmin}
                      onChange={(e) => handleChange(clave, e.target.value)}
                      className="w-full px-3 pr-16 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:bg-surface-muted disabled:cursor-not-allowed tabular-nums font-medium"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-content-tertiary text-[10px] font-bold pointer-events-none">
                      {sufijo}
                    </span>
                  </div>
                  <p className="text-[10px] text-content-muted leading-snug">{hint}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 px-5 py-3 bg-surface-subtle border-t border-border-subtle">
        {dirty && <Button variant="ghost" size="sm" icon={RotateCcw} onClick={handleReset} disabled={isSaving}>Descartar</Button>}
        <Button variant="primary" size="sm" icon={Save} onClick={handleSave} disabled={!dirty || !esAdmin || isSaving} loading={isSaving}>
          Guardar cambios
        </Button>
      </div>
    </div>
  );
};

export default FinancieroTab;
