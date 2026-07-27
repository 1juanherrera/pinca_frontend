import { useMemo, useState } from 'react';
import { Save, RotateCcw, BadgeDollarSign, Coins, Percent } from 'lucide-react';
import { Button } from '../../../shared/Button';
import IconBox from '../../../shared/IconBox';
import { fmt } from '../../../utils/formatters';
import { useConfiguracionGrupo, useBulkUpdateConfig } from '../api/useConfiguracion';
import { useBoundStore } from '../../../store/useBoundStore';

const SECCIONES = [
  {
    id: 'salario',
    titulo: 'Salario mínimo y auxilio',
    icon: Coins,
    tone: 'warning',
    descripcion: 'Valores legales vigentes del año. El auxilio de transporte se paga a quien gane hasta 2 SMMLV.',
    campos: [
      {
        clave: 'nomina_smmlv', label: 'Salario mínimo (SMMLV)', sufijo: '$', money: true,
        min: 0, step: 1000,
        hint: 'Salario mínimo mensual legal vigente. Define el tope (2×) para el auxilio de transporte.',
      },
      {
        clave: 'nomina_auxilio_transporte', label: 'Auxilio de transporte', sufijo: '$', money: true,
        min: 0, step: 1000,
        hint: 'Auxilio mensual. Se paga proporcional a los días trabajados a quien gane hasta 2 SMMLV.',
      },
    ],
  },
  {
    id: 'deducciones',
    titulo: 'Deducciones del empleado',
    icon: Percent,
    tone: 'danger',
    descripcion: 'Porcentajes que se descuentan al empleado sobre el salario devengado (el auxilio de transporte no es base).',
    campos: [
      {
        clave: 'nomina_pct_salud', label: 'Salud', sufijo: '%',
        min: 0, max: 100, step: 0.5,
        hint: 'Aporte de salud a cargo del empleado. Estándar en Colombia: 4%.',
      },
      {
        clave: 'nomina_pct_pension', label: 'Pensión', sufijo: '%',
        min: 0, max: 100, step: 0.5,
        hint: 'Aporte de pensión a cargo del empleado. Estándar en Colombia: 4%.',
      },
    ],
  },
];

const NominaTab = () => {
  const user    = useBoundStore((s) => s.user);
  const esAdmin = user?.rol === 'admin';

  const { data: grupo, isLoading } = useConfiguracionGrupo('nomina');
  const { mutate: bulkUpdate, isPending: isSaving } = useBulkUpdateConfig();

  const originales = useMemo(() => {
    if (!grupo) return {};
    const next = {};
    Object.entries(grupo).forEach(([clave, item]) => { next[clave] = item.valor; });
    return next;
  }, [grupo]);

  const [overrides, setOverrides] = useState({});
  const valores = useMemo(() => ({ ...originales, ...overrides }), [originales, overrides]);

  const dirty = useMemo(
    () => Object.keys(overrides).some((k) => overrides[k] !== originales[k]),
    [overrides, originales]
  );

  const handleChange = (clave, raw) =>
    setOverrides((prev) => ({ ...prev, [clave]: raw === '' ? '' : Number(raw) }));

  const handleSave = () => {
    if (!dirty || !esAdmin) return;
    bulkUpdate(valores, { onSuccess: () => setOverrides({}) });
  };
  const handleReset = () => setOverrides({});

  if (isLoading) {
    return (
      <div className="bg-surface-base border border-border-base rounded-xl shadow-card p-6 space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-24 bg-surface-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const lastUpdated = grupo?.nomina_smmlv?.updated_at;
  const lastBy      = grupo?.nomina_smmlv?.updated_by;

  return (
    <div className="bg-surface-base border border-border-base rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-border-subtle">
        <IconBox icon={BadgeDollarSign} tone="success" variant="subtle" size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-content-primary">Parámetros de nómina</h3>
          <p className="text-xs text-content-tertiary mt-0.5">
            Controlan el cálculo de las liquidaciones (módulo Nómina). Actualizá el SMMLV y el
            auxilio de transporte al valor legal vigente cada año.
          </p>
        </div>
      </div>

      {/* Secciones */}
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
              {sec.campos.map(({ clave, label, sufijo, min, max, step, hint, money }) => (
                <div key={clave} className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-content-secondary">{label}</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={min} max={max} step={step}
                      value={valores[clave] ?? ''}
                      disabled={!esAdmin}
                      onChange={(e) => handleChange(clave, e.target.value)}
                      className="w-full px-3 pr-12 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:bg-surface-muted disabled:cursor-not-allowed tabular-nums font-medium"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-content-tertiary text-xs font-bold pointer-events-none">
                      {sufijo}
                    </span>
                  </div>
                  <p className="text-[10px] text-content-muted leading-snug">
                    {hint}
                    {money && Number(valores[clave]) > 0 && (
                      <span className="ml-1 font-semibold text-content-secondary">= {fmt(valores[clave])}</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
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

export default NominaTab;
