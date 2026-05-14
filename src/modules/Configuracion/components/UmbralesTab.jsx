import { useEffect, useState } from 'react';
import { Save, RotateCcw, Boxes, Wallet, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '../../../shared/Button';
import IconBox from '../../../shared/IconBox';
import { useConfiguracionGrupo, useBulkUpdateConfig } from '../api/useConfiguracion';
import { useBoundStore } from '../../../store/useBoundStore';

const SECCIONES = [
  {
    id:    'stock',
    titulo: 'Stock',
    icon:   Boxes,
    tone:   'warning',
    descripcion: 'Días de cobertura restantes para clasificar el stock de materias primas.',
    campos: [
      {
        clave: 'stock_critico_dias', label: 'Crítico (rojo)',  sufijo: 'días', min: 1, max: 365, step: 1,
        hint:  'Stock por debajo → MP marcada como crítica en el dashboard.',
      },
      {
        clave: 'stock_warning_dias', label: 'Advertencia (amarillo)', sufijo: 'días', min: 1, max: 365, step: 1,
        hint:  'Stock entre crítico y este valor → advertencia. Por encima → ok.',
      },
    ],
  },
  {
    id:    'cartera',
    titulo: 'Cartera',
    icon:   Wallet,
    tone:   'danger',
    descripcion: 'Días de mora desde los cuales una factura entra en alerta.',
    campos: [
      {
        clave: 'mora_warning_dias', label: 'Advertencia (amarillo)', sufijo: 'días', min: 1, max: 365, step: 1,
        hint:  'Factura vencida → alerta amarilla a partir de este día.',
      },
      {
        clave: 'mora_critica_dias', label: 'Crítica (rojo)', sufijo: 'días', min: 1, max: 365, step: 1,
        hint:  'Factura vencida → alerta roja a partir de este día.',
      },
    ],
  },
  {
    id:    'rentabilidad',
    titulo: 'Rentabilidad',
    icon:   TrendingUp,
    tone:   'success',
    descripcion: 'Margen objetivo y mínimo aceptable para cada producto / venta.',
    campos: [
      {
        clave: 'margen_minimo_pct', label: 'Mínimo aceptable', sufijo: '%', min: 0, max: 100, step: 0.5,
        hint:  'Por debajo: margen marcado en rojo en el dashboard.',
      },
      {
        clave: 'margen_objetivo_pct', label: 'Objetivo', sufijo: '%', min: 0, max: 100, step: 0.5,
        hint:  'Por encima: margen marcado en verde (saludable).',
      },
    ],
  },
];

const UmbralesTab = () => {
  const user    = useBoundStore((s) => s.user);
  const esAdmin = user?.rol === 'admin';

  const { data: grupo, isLoading } = useConfiguracionGrupo('umbrales');
  const { mutate: bulkUpdate, isPending: isSaving } = useBulkUpdateConfig();

  const [valores,    setValores]    = useState({});
  const [originales, setOriginales] = useState({});

  useEffect(() => {
    if (!grupo) return;
    const next = {};
    Object.entries(grupo).forEach(([clave, item]) => { next[clave] = item.valor; });
    setValores(next);
    setOriginales(next);
  }, [grupo]);

  const dirty = JSON.stringify(valores) !== JSON.stringify(originales);

  const handleChange = (clave, raw) => {
    setValores((prev) => ({ ...prev, [clave]: raw === '' ? '' : Number(raw) }));
  };

  // Validación cruzada por sección
  const advertencias = (() => {
    const w = [];
    if (Number(valores.stock_critico_dias) >= Number(valores.stock_warning_dias)) {
      w.push('Stock: el umbral crítico debe ser menor que el de advertencia.');
    }
    if (Number(valores.mora_warning_dias) >= Number(valores.mora_critica_dias)) {
      w.push('Cartera: la advertencia debe ser menor que el umbral crítico.');
    }
    if (Number(valores.margen_minimo_pct) >= Number(valores.margen_objetivo_pct)) {
      w.push('Rentabilidad: el margen mínimo debe ser menor que el objetivo.');
    }
    return w;
  })();

  const handleSave = () => {
    if (!dirty || !esAdmin || advertencias.length > 0) return;
    bulkUpdate(valores);
  };

  const handleReset = () => setValores(originales);

  if (isLoading) {
    return (
      <div className="bg-surface-base border border-border-base rounded-xl shadow-card p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-surface-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const lastUpdated = grupo?.stock_critico_dias?.updated_at;
  const lastBy      = grupo?.stock_critico_dias?.updated_by;

  return (
    <div className="bg-surface-base border border-border-base rounded-xl shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-border-subtle">
        <IconBox icon={AlertTriangle} tone="warning" variant="subtle" size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-content-primary">Umbrales de alertas</h3>
          <p className="text-xs text-content-tertiary mt-0.5">
            Estos valores controlan los semáforos del dashboard, inventario y cartera.
            Cambiarlos actualiza la visualización para todos los usuarios al refrescar.
          </p>
        </div>
      </div>

      {/* Secciones */}
      <div className="p-5 space-y-5">
        {SECCIONES.map((sec) => (
          <div key={sec.id} className="rounded-xl border border-border-subtle bg-surface-subtle/40 overflow-hidden">
            {/* Header de sección */}
            <div className="flex items-start gap-2.5 px-4 py-3 bg-surface-base border-b border-border-subtle">
              <IconBox icon={sec.icon} tone={sec.tone} variant="subtle" size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-content-primary">{sec.titulo}</p>
                <p className="text-[10px] text-content-tertiary mt-0.5">{sec.descripcion}</p>
              </div>
            </div>
            {/* Campos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {sec.campos.map(({ clave, label, sufijo, min, max, step, hint }) => (
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
                  <p className="text-[10px] text-content-muted leading-snug">{hint}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Validaciones cruzadas */}
      {advertencias.length > 0 && (
        <div className="mx-5 mb-4 flex items-start gap-2 rounded-lg bg-semantic-danger-subtle/60 border border-semantic-danger/20 px-3 py-2.5">
          <AlertTriangle size={13} className="text-semantic-danger-fg mt-0.5 shrink-0" />
          <ul className="text-[11px] text-semantic-danger-fg space-y-0.5">
            {advertencias.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

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
            disabled={!dirty || !esAdmin || isSaving || advertencias.length > 0}
            loading={isSaving}
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UmbralesTab;
