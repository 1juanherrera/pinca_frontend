import { useMemo, useState } from 'react';
import { Save, RotateCcw, ShieldCheck, KeyRound, Clock, Lock, Hash, AlertCircle } from 'lucide-react';
import { Button } from '../../../shared/Button';
import IconBox from '../../../shared/IconBox';
import { useConfiguracionGrupo, useBulkUpdateConfig } from '../api/useConfiguracion';
import { useBoundStore } from '../../../store/useBoundStore';

const SECCIONES = [
  {
    id: 'sesion', titulo: 'Sesión',  icon: Clock, tone: 'info',
    descripcion: 'Tiempo de validez del JWT y de la sesión recordada (refresh token).',
    campos: [
      {
        clave: 'jwt_expiracion_horas', label: 'Duración del JWT', sufijo: 'horas',
        min: 1, max: 168, step: 1,
        hint: 'Tras este tiempo el usuario debe volver a iniciar sesión. Recomendado: 8–12 h.',
      },
      {
        clave: 'refresh_token_dias', label: 'Sesión recordada', sufijo: 'días',
        min: 1, max: 90, step: 1,
        hint: 'Duración del refresh token: mientras esté vigente, la sesión se renueva sin re-login. Al vencer, login completo. Recomendado: 7–30 días.',
      },
    ],
  },
  {
    id: 'login', titulo: 'Rate-limit de login', icon: KeyRound, tone: 'warning',
    descripcion: 'Bloqueo temporal de IP tras intentos fallidos de login.',
    campos: [
      {
        clave: 'max_intentos_login', label: 'Intentos máximos', sufijo: 'intentos',
        min: 1, max: 50, step: 1,
        hint: 'Cantidad de fallos antes de bloquear la IP.',
      },
      {
        clave: 'ventana_intentos_segundos', label: 'Ventana de bloqueo', sufijo: 'segundos',
        min: 60, max: 7200, step: 60,
        hint: 'Tiempo en segundos que se cuentan los fallos (900 = 15 min).',
      },
    ],
  },
  {
    id: 'password', titulo: 'Contraseñas', icon: Lock, tone: 'danger',
    descripcion: 'Política de longitud mínima para contraseñas nuevas.',
    campos: [
      {
        clave: 'password_min_caracteres', label: 'Longitud mínima', sufijo: 'caracteres',
        min: 6, max: 64, step: 1,
        hint: 'Aplicado al crear usuarios y al cambiar contraseña.',
      },
    ],
  },
];

const SeguridadTab = () => {
  const user    = useBoundStore((s) => s.user);
  const esAdmin = user?.rol === 'admin';

  const { data: grupo, isLoading } = useConfiguracionGrupo('seguridad');
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

  const lastUpdated = grupo?.jwt_expiracion_horas?.updated_at;
  const lastBy      = grupo?.jwt_expiracion_horas?.updated_by;

  // Convertir ventana a minutos para mostrar legible
  const ventanaMin = Math.round((Number(valores.ventana_intentos_segundos) || 0) / 60);

  return (
    <div className="bg-surface-base border border-border-base rounded-xl shadow-card overflow-hidden">
      <div className="flex items-start gap-3 px-5 py-4 border-b border-border-subtle">
        <IconBox icon={ShieldCheck} tone="danger" variant="subtle" size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-content-primary">Políticas de seguridad</h3>
          <p className="text-xs text-content-tertiary mt-0.5">
            Estos parámetros afectan a todos los usuarios y al flujo de login. El secreto del JWT no se gestiona desde aquí — vive en la variable de entorno <code className="bg-surface-muted px-1 py-0.5 rounded text-[10px]">TOKEN_SECRET</code>.
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
                      className="w-full px-3 pr-20 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:bg-surface-muted disabled:cursor-not-allowed tabular-nums font-medium"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-content-tertiary text-[10px] font-bold pointer-events-none">
                      {sufijo}
                    </span>
                  </div>
                  <p className="text-[10px] text-content-muted leading-snug">
                    {hint}
                    {clave === 'ventana_intentos_segundos' && ventanaMin > 0 && (
                      <span className="ml-1 font-semibold text-content-secondary">≈ {ventanaMin} min</span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Aviso sobre TOKEN_SECRET */}
        <div className="flex items-start gap-2 rounded-lg bg-semantic-warning-subtle/60 border border-semantic-warning/15 px-3 py-2.5">
          <AlertCircle size={13} className="text-semantic-warning-fg mt-0.5 shrink-0" />
          <p className="text-[11px] text-semantic-warning-fg leading-snug">
            Cambios en la duración del JWT solo afectan a sesiones <strong>nuevas</strong>. Las sesiones activas mantienen su tiempo original. Para forzar re-login global, cambia <code className="bg-semantic-warning-subtle px-1 rounded">TOKEN_SECRET</code> en <code>.env</code> (invalida todos los tokens).
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-surface-subtle border-t border-border-subtle">
        <p className="text-[10px] text-content-muted">
          {lastUpdated && <>Última actualización: <span className="font-semibold text-content-tertiary">{lastUpdated}</span> por <span className="font-semibold text-content-tertiary">{lastBy ?? 'sistema'}</span></>}
        </p>
        <div className="flex items-center gap-2">
          {dirty && <Button variant="ghost" size="sm" icon={RotateCcw} onClick={handleReset} disabled={isSaving}>Descartar</Button>}
          <Button variant="primary" size="sm" icon={Save} onClick={handleSave} disabled={!dirty || !esAdmin || isSaving} loading={isSaving}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SeguridadTab;
