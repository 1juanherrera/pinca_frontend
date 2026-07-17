import { useMemo, useState } from 'react';
import { Save, RotateCcw, Rows3, ListOrdered } from 'lucide-react';
import { Button } from '../../../shared/Button';
import IconBox from '../../../shared/IconBox';
import { useConfiguracion, useBulkUpdateConfig } from '../api/useConfiguracion';
import { useBoundStore } from '../../../store/useBoundStore';

// Grupo `paginacion` de configuracion_sistema. Estos valores los leen las tablas
// listables vía useConfigValue('page_size_default') y el backend los usa como cap.
const SECCIONES = [
  {
    id: 'paginacion', titulo: 'Filas por página', icon: Rows3, tone: 'info', grupo: 'paginacion',
    descripcion: 'Cuántas filas muestran por página las tablas del sistema (catálogo, clientes, facturas, etc.).',
    campos: [
      {
        clave: 'page_size_default', label: 'Filas por página (default)', sufijo: 'filas',
        min: 5, max: 200, step: 5,
        hint: 'Valor inicial en todas las tablas listables. Cada tabla permite cambiarlo con su selector de filas.',
      },
      {
        clave: 'max_per_page', label: 'Máximo por página', sufijo: 'filas',
        min: 20, max: 500, step: 10,
        hint: 'Tope que el servidor permite pedir por página (protección contra pedidos enormes).',
      },
    ],
  },
];

const PaginacionTab = () => {
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
        {Array.from({ length: 1 }).map((_, i) => (
          <div key={i} className="h-24 bg-surface-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-surface-base border border-border-base rounded-xl shadow-card overflow-hidden">
      <div className="flex items-start gap-3 px-5 py-4 border-b border-border-subtle">
        <IconBox icon={ListOrdered} tone="info" variant="subtle" size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-content-primary">Paginación de tablas</h3>
          <p className="text-xs text-content-tertiary mt-0.5">
            Cantidad de filas por página por default y el tope máximo permitido por el servidor.
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

export default PaginacionTab;
