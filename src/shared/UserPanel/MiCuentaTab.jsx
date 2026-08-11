import { useState, useEffect } from 'react';
import { Clock, LogOut, User as UserIcon } from 'lucide-react';
import { useBoundStore } from '../../store/useBoundStore';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../api/apiClient';
import { API_ROUTES } from '../../api/apiRoutes';
import toast from 'react-hot-toast';
import { ROLES_LABELS } from '../../config/modulos';
import { ROL_STYLES, useAvatarGradient } from '../../utils/avatarTheme';
import { SectionTitle } from './atoms';
import { getInitials, decodeJwt, formatCountdown } from './constants';

// ─── TAB: Mi Cuenta ───────────────────────────────────────────────────────────
const MiCuentaTab = ({ user, token, onLogout }) => {
  const [countdown, setCountdown] = useState(0);
  const [pctUsed,   setPctUsed]   = useState(0);
  const [nombreInput, setNombreInput] = useState(user?.nombre ?? '');
  // Sync local cuando el user cambia (post-login o post-save) — ajustado
  // durante el render (no en un efecto) para evitar el flash de valor stale.
  const [nombreSincronizado, setNombreSincronizado] = useState(user?.nombre ?? '');
  if ((user?.nombre ?? '') !== nombreSincronizado) {
    setNombreSincronizado(user?.nombre ?? '');
    setNombreInput(user?.nombre ?? '');
  }
  const setAuth = useBoundStore(s => s.setAuth);

  const rol   = user?.rol  ?? 'visor';
  const style = ROL_STYLES[rol] ?? ROL_STYLES.visor;
  const avatarGrad = useAvatarGradient(rol);

  // Countdown del token
  useEffect(() => {
    const jwt = decodeJwt(token);
    if (!jwt) return;
    const SESSION = 8 * 3600;
    const tick = () => {
      const remaining = jwt.exp - Math.floor(Date.now() / 1000);
      const elapsed   = jwt.iat ? (Math.floor(Date.now() / 1000) - jwt.iat) : 0;
      setCountdown(Math.max(0, remaining));
      setPctUsed(Math.min(100, Math.round((elapsed / SESSION) * 100)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [token]);

  const jwt = decodeJwt(token);
  const loginAt = jwt?.iat ? new Date(jwt.iat * 1000).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  const { mutate: guardarNombre, isPending: isPendingNombre } = useMutation({
    mutationFn: (nombre) => apiClient.patch(API_ROUTES.AUTH.ACTUALIZAR_PERFIL, { nombre }),
    onSuccess: (res) => {
      // El backend re-emite el token con el nombre nuevo
      const nuevoToken   = res?.token   ?? res?.data?.token;
      const nuevoUsuario = res?.usuario ?? res?.data?.usuario;
      if (nuevoToken && nuevoUsuario) {
        localStorage.setItem('token', nuevoToken);
        setAuth(nuevoToken, nuevoUsuario);
      }
      toast.success('Nombre actualizado');
    },
    onError: (e) => toast.error(e?.response?.data?.msg || 'No se pudo actualizar el nombre'),
  });

  const barColor = pctUsed < 50 ? 'bg-semantic-success' : pctUsed < 75 ? 'bg-semantic-warning' : 'bg-semantic-danger';

  return (
    <div className="flex flex-col gap-5 p-5 pb-4">

      {/* Avatar + info */}
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${avatarGrad} flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0`}>
          {getInitials(user?.nombre, user?.username)}
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-content-primary truncate">{user?.nombre || user?.username}</p>
          {user?.nombre && (
            <p className="text-[11px] text-content-tertiary font-mono truncate">@{user.username}</p>
          )}
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.badge}`}>
            {ROLES_LABELS[rol] ?? rol}
          </span>
        </div>
      </div>

      {/* Sesión activa */}
      <div className="rounded-xl border border-border-subtle bg-surface-subtle p-3">
        <div className="flex items-center justify-between mb-2">
          <SectionTitle icon={Clock}>Sesión activa</SectionTitle>
          <span className={`text-[11px] font-mono font-semibold ${countdown < 1800 ? 'text-semantic-danger' : 'text-content-tertiary'}`}>
            {formatCountdown(countdown)}
          </span>
        </div>
        <div className="w-full h-1.5 bg-surface-strong rounded-full overflow-hidden mb-2">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pctUsed}%` }} />
        </div>
        <p className="text-[11px] text-content-muted">Inicio de sesión: <span className="text-content-secondary font-medium">{loginAt}</span></p>
      </div>

      {/* Editar perfil */}
      <div>
        <SectionTitle icon={UserIcon}>Editar perfil</SectionTitle>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = nombreInput.trim();
            if (trimmed.length > 100) return toast.error('Máximo 100 caracteres.');
            guardarNombre(trimmed);
          }}
          className="flex flex-col gap-2.5"
        >
          <div>
            <label className="block text-xs text-content-tertiary mb-1">Nombre para mostrar</label>
            <input
              type="text"
              value={nombreInput}
              onChange={(e) => setNombreInput(e.target.value)}
              placeholder="Ej. Juan Pérez"
              maxLength={100}
              className="w-full border border-border-base rounded-lg px-3 py-2 text-sm bg-surface-subtle text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:bg-surface-base transition-all"
            />
            <p className="text-[10px] text-content-muted mt-1">
              Es el nombre que verás en el saludo y la cabecera. Tu username (<span className="font-mono">{user?.username}</span>) sigue siendo el identificador para iniciar sesión.
            </p>
          </div>
          <button
            type="submit"
            disabled={isPendingNombre || nombreInput.trim() === (user?.nombre ?? '')}
            className="w-full py-2 rounded-lg text-sm font-semibold bg-content-primary hover:bg-content-secondary text-content-inverse transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPendingNombre ? 'Guardando…' : 'Guardar nombre'}
          </button>
        </form>
      </div>

      {/* Logout */}
      <button onClick={onLogout}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-semantic-danger/20 text-white hover:bg-semantic-danger/80 bg-semantic-danger transition-colors text-sm font-medium">
        <LogOut size={15} /> Cerrar sesión
      </button>
    </div>
  );
};

export default MiCuentaTab;
