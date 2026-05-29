import { useMemo, useState } from 'react';
import { Save, Receipt, Percent, RotateCcw } from 'lucide-react';
import { Button } from '../../../shared/Button';
import IconBox from '../../../shared/IconBox';
import { useConfiguracionGrupo, useBulkUpdateConfig } from '../api/useConfiguracion';
import { useBoundStore } from '../../../store/useBoundStore';

const CAMPOS = [
  {
    clave:       'iva_default',
    label:       'IVA general',
    sufijo:      '%',
    min: 0, max: 100, step: 0.1,
    descripcion: 'Aplicado por defecto al toggle "IVA" en formularios.',
  },
  {
    clave:       'retencion_fuente_pct',
    label:       'Retención en la fuente',
    sufijo:      '%',
    min: 0, max: 100, step: 0.01,
    descripcion: 'ReteFuente — varía por concepto y régimen.',
  },
  {
    clave:       'retencion_iva_pct',
    label:       'Retención de IVA (ReteIVA)',
    sufijo:      '%',
    min: 0, max: 100, step: 0.1,
    descripcion: 'Porcentaje del IVA pagado que se retiene al proveedor.',
  },
  {
    clave:       'retencion_ica_default',
    label:       'ReteICA',
    sufijo:      '‰',
    min: 0, max: 100, step: 0.01,
    descripcion: 'Por mil — default Barranquilla. Ajustar por ciudad/actividad.',
  },
];

const TributariaTab = () => {
  const user    = useBoundStore((s) => s.user);
  const esAdmin = user?.rol === 'admin';

  const { data: grupo, isLoading } = useConfiguracionGrupo('tributaria');
  const { mutate: bulkUpdate, isPending: isSaving } = useBulkUpdateConfig();

  const originales = useMemo(() => {
    if (!grupo) return {};
    const next = {};
    Object.entries(grupo).forEach(([clave, item]) => {
      next[clave] = item.valor;
    });
    return next;
  }, [grupo]);

  const [overrides, setOverrides] = useState({});
  const valores = useMemo(() => ({ ...originales, ...overrides }), [originales, overrides]);

  const dirty = useMemo(
    () => Object.keys(overrides).some((k) => overrides[k] !== originales[k]),
    [overrides, originales]
  );

  const handleChange = (clave, raw, tipo = 'number') => {
    setOverrides((prev) => ({
      ...prev,
      [clave]: tipo === 'boolean' ? !!raw : (raw === '' ? '' : Number(raw)),
    }));
  };

  const handleSave = () => {
    if (!dirty || !esAdmin) return;
    bulkUpdate(valores, { onSuccess: () => setOverrides({}) });
  };

  const handleReset = () => setOverrides({});

  const lastUpdated = grupo?.iva_default?.updated_at;
  const lastBy      = grupo?.iva_default?.updated_by;

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
      {/* Header de la card */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-border-subtle">
        <IconBox icon={Receipt} tone="info" variant="subtle" size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-content-primary">Parámetros tributarios</h3>
          <p className="text-xs text-content-tertiary mt-0.5">
            Estos valores se usan como default en facturas, compras y cotizaciones.
            Cada documento puede sobrescribirlos puntualmente.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {CAMPOS.map(({ clave, label, sufijo, min, max, step, descripcion }) => (
          <div key={clave} className="space-y-1.5">
            <label className="block text-[11px] font-semibold text-content-secondary">
              {label}
            </label>
            <div className="relative">
              <input
                type="number"
                min={min} max={max} step={step}
                value={valores[clave] ?? ''}
                disabled={!esAdmin}
                onChange={(e) => handleChange(clave, e.target.value)}
                className="w-full px-3 pr-9 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:bg-surface-muted disabled:cursor-not-allowed tabular-nums font-medium"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-content-tertiary text-xs font-bold pointer-events-none">
                {sufijo}
              </span>
            </div>
            <p className="text-[10px] text-content-muted leading-snug">{descripcion}</p>
          </div>
        ))}

        {/* Toggle aplicar IVA */}
        <div className="md:col-span-2 flex items-start gap-3 p-3 rounded-lg bg-surface-subtle border border-border-subtle">
          <button
            type="button"
            disabled={!esAdmin}
            onClick={() => handleChange('aplicar_iva_por_default', !valores.aplicar_iva_por_default, 'boolean')}
            className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shrink-0 mt-0.5 ${
              valores.aplicar_iva_por_default ? 'bg-content-primary' : 'bg-surface-strong'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-surface-base rounded-full shadow transition-transform duration-200 ${
              valores.aplicar_iva_por_default ? 'translate-x-4.5' : 'translate-x-0'
            }`} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-content-secondary inline-flex items-center gap-1.5">
              <Percent size={11} /> Aplicar IVA por defecto en formularios
            </p>
            <p className="text-[10px] text-content-muted mt-0.5">
              Si está activo, el toggle "IVA" aparece prendido al abrir cualquier form de compra.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-surface-subtle border-t border-border-subtle">
        <p className="text-[10px] text-content-muted">
          {lastUpdated && (
            <>Última actualización: <span className="font-semibold text-content-tertiary">{lastUpdated}</span> por <span className="font-semibold text-content-tertiary">{lastBy ?? 'sistema'}</span></>
          )}
        </p>
        <div className="flex items-center gap-2">
          {dirty && (
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={handleReset} disabled={isSaving}>
              Descartar
            </Button>
          )}
          <Button
            variant="primary" size="sm" icon={Save}
            onClick={handleSave}
            disabled={!dirty || !esAdmin || isSaving}
            loading={isSaving}
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TributariaTab;
