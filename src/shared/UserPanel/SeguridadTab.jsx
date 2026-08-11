import { Clock, History, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { API_ROUTES } from '../../api/apiRoutes';
import { ROLES_LABELS } from '../../config/modulos';
import { SectionTitle } from './atoms';
import { maskIp, fmtDate, decodeJwt } from './constants';
import CambiarPasswordForm from './CambiarPasswordForm';

// ─── TAB: Seguridad ───────────────────────────────────────────────────────────
const SeguridadTab = ({ user }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['mi-actividad'],
    queryFn:  () => apiClient.get(API_ROUTES.AUTH.MI_ACTIVIDAD),
    select:   (r) => r.data ?? [],
  });

  const jwt     = decodeJwt(localStorage.getItem('token') || '');
  const expDate = jwt?.exp ? new Date(jwt.exp * 1000).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const loginAt = jwt?.iat ? new Date(jwt.iat * 1000).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <div className="flex flex-col gap-5 p-5">

      {/* Detalles de sesión */}
      <div>
        <SectionTitle icon={Clock}>Sesión actual</SectionTitle>
        <div className="rounded-xl border border-border-subtle divide-y divide-border-subtle text-sm overflow-hidden">
          {[
            { label: 'Usuario',          value: user?.username },
            { label: 'Rol',              value: ROLES_LABELS[user?.rol] ?? user?.rol },
            { label: 'Inicio de sesión', value: loginAt },
            { label: 'Expira',           value: expDate },
            { label: 'Módulos',          value: `${user?.modulos?.length ?? 0} asignados` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-3 py-2.5 hover:bg-surface-subtle transition-colors">
              <span className="text-content-tertiary">{label}</span>
              <span className="font-medium text-content-secondary">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cambiar contraseña */}
      <CambiarPasswordForm />

      {/* Historial de accesos */}
      <div>
        <SectionTitle icon={History}>Últimos intentos de acceso</SectionTitle>
        {isLoading ? (
          <p className="text-xs text-content-muted">Cargando historial…</p>
        ) : (data ?? []).length === 0 ? (
          <p className="text-xs text-content-muted">Sin registros recientes.</p>
        ) : (
          <div className="rounded-xl border border-border-subtle divide-y divide-border-subtle overflow-hidden">
            {(data ?? []).map((row, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 hover:bg-surface-subtle transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-surface-strong shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-content-secondary">{fmtDate(row.created_at)}</p>
                    <p className="text-[10px] text-content-muted">IP: {maskIp(row.ip_address)}</p>
                  </div>
                </div>
                <span className="text-[10px] text-content-muted bg-surface-muted px-2 py-0.5 rounded-full">Intento</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-content-muted mt-2">Se muestran los últimos 10 intentos registrados para tu usuario.</p>
      </div>

      {/* Info de seguridad */}
      <div className="rounded-xl bg-semantic-warning-subtle border border-semantic-warning/15 p-3 flex gap-2.5">
        <AlertCircle size={16} className="text-semantic-warning shrink-0 mt-0.5" />
        <p className="text-xs text-semantic-warning-fg">
          Si detectas accesos no autorizados, cierra sesión inmediatamente y contacta al administrador para restablecer tu contraseña.
        </p>
      </div>
    </div>
  );
};

export default SeguridadTab;
