import { useState, useEffect, useCallback } from 'react';
import {
  X, KeyRound, Eye, EyeOff, LogOut, ShieldCheck, UserCircle,
  Clock, History, Settings2, AlertCircle, Bell,
  BellOff, Rows3, Maximize2, Palette, Check, User as UserIcon, HeartPulse,
  Sun, Moon, Monitor,
} from 'lucide-react';
import SaludSistemaPage from '../modules/SaludSistema/SaludSistemaPage';
import { useBoundStore }  from '../store/useBoundStore';
import { useTheme }        from '../hooks/useTheme';
import { useNavigate }    from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient           from '../api/apiClient';
import { API_ROUTES }      from '../api/apiRoutes';
import toast               from 'react-hot-toast';
import { MODULOS_SISTEMA, ROLES_LABELS } from '../config/modulos';
import { usePermisos, useUpdatePermisos, useUsuariosRoles, useCambiarRol } from '../modules/Roles/api/useRoles';
import {
  ROL_STYLES, AVATAR_PALETTE,
  useAvatarGradient, useAvatarKey, setStoredAvatarKey,
} from '../utils/avatarTheme';

// ─── Constantes ───────────────────────────────────────────────────────────────
// Roles ordenados de mayor a menor privilegio. `superadmin` y `admin` siempre
// tienen acceso total — sus toggles aparecen lockeados en la matriz.
const ROLES = ['superadmin', 'admin', 'operador', 'visor'];
const ROLES_LOCKEADOS = ['superadmin', 'admin'];

/**
 * Iniciales: primera letra de los 2 primeros tokens del nombre completo.
 *   "Juan Pérez"        → JP
 *   "María de la Cruz"  → MD
 *   "Juan"              → J
 *   sin nombre          → primeras 2 letras del username
 */
const getInitials  = (nombre = '', username = '') => {
  const tokens = String(nombre).trim().split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) return (tokens[0][0] + tokens[1][0]).toUpperCase();
  if (tokens.length === 1) return tokens[0][0].toUpperCase();
  return String(username).slice(0, 2).toUpperCase();
};
const maskIp       = (ip = '') => ip.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, '$1.$2.*.*');
const fmtDate      = (str)    => new Date(str).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
const decodeJwt    = (tok)    => { try { return JSON.parse(atob(tok.split('.')[1])); } catch { return null; } };

const formatCountdown = (secs) => {
  if (secs <= 0) return 'Expirada';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
};

// ─── Componentes reutilizables ────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
  <button type="button" disabled={disabled} onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
      disabled ? 'opacity-40 cursor-not-allowed bg-surface-strong'
      : checked  ? 'bg-semantic-success cursor-pointer'
                 : 'bg-surface-strong cursor-pointer'
    }`}
  >
    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-surface-base shadow transition-transform ${
      checked ? 'translate-x-4.5' : 'translate-x-0.75'
    }`} />
  </button>
);

const SectionTitle = ({ icon: Icon, children }) => (
  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-content-muted uppercase tracking-wider mb-2">
    <Icon size={11} />{children}
  </p>
);


// ─── TAB: Mi Cuenta ───────────────────────────────────────────────────────────
const MiCuentaTab = ({ user, token, onLogout }) => {
  const [countdown, setCountdown] = useState(0);
  const [pctUsed,   setPctUsed]   = useState(0);
  const [nombreInput, setNombreInput] = useState(user?.nombre ?? '');
  const setAuth = useBoundStore(s => s.setAuth);

  // Sync local cuando el user cambia (post-login o post-save)
  useEffect(() => { setNombreInput(user?.nombre ?? ''); }, [user?.nombre]);

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

// ─── Cambiar contraseña (vive dentro del tab Seguridad) ───────────────────────
const CambiarPasswordForm = () => {
  const user    = useBoundStore(s => s.user);
  const setAuth = useBoundStore(s => s.setAuth);
  const [show, setShow] = useState({ curr: false, next: false, conf: false });
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [ok,   setOk]   = useState(false);

  const { mutate: cambiarPwd, isPending } = useMutation({
    mutationFn: (body) => apiClient.patch(API_ROUTES.AUTH.CAMBIAR_PASSWORD, body),
    onSuccess: (res) => {
      // El backend bumpea token_version al cambiar password — usar el token
      // nuevo para que esta sesión no caiga al próximo request.
      const nuevoToken = res?.token;
      if (nuevoToken && user) setAuth(nuevoToken, user);
      toast.success('Contraseña actualizada');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setOk(true);
      setTimeout(() => setOk(false), 3000);
    },
    onError: (e) => toast.error(e?.response?.data?.msg || 'Contraseña actual incorrecta'),
  });

  const handlePwd = (e) => {
    e.preventDefault();
    if (form.newPassword.length < 8) return toast.error('Mínimo 8 caracteres.');
    if (form.newPassword !== form.confirmPassword) return toast.error('Las contraseñas no coinciden.');
    cambiarPwd({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  };

  return (
    <div>
      <SectionTitle icon={KeyRound}>Cambiar contraseña</SectionTitle>
      <form onSubmit={handlePwd} className="flex flex-col gap-2.5">
        {[
          { key: 'currentPassword', label: 'Contraseña actual',          sk: 'curr' },
          { key: 'newPassword',     label: 'Nueva contraseña',            sk: 'next' },
          { key: 'confirmPassword', label: 'Confirmar nueva contraseña',  sk: 'conf' },
        ].map(({ key, label, sk }) => (
          <div key={key} className="relative">
            <label className="block text-xs text-content-tertiary mb-1">{label}</label>
            <div className="relative">
              <input type={show[sk] ? 'text' : 'password'} value={form[key]} required autoComplete={sk === 'curr' ? 'current-password' : 'new-password'}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-border-base rounded-lg px-3 py-2 pr-9 text-sm bg-surface-subtle text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:bg-surface-base transition-all" />
              <button type="button" onClick={() => setShow(s => ({ ...s, [sk]: !s[sk] }))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary">
                {show[sk] ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        ))}
        <button type="submit" disabled={isPending}
          className={`w-full py-2 rounded-lg text-sm font-semibold transition-all mt-1 ${
            ok ? 'bg-semantic-success text-content-inverse' : 'bg-content-primary hover:bg-content-secondary text-content-inverse disabled:opacity-60'
          }`}>
          {isPending ? 'Guardando…' : ok ? '¡Actualizada correctamente!' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  );
};

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

// ─── TAB: Preferencias ────────────────────────────────────────────────────────
const readPref = (key, def) => {
  const v = localStorage.getItem(key);
  return v === null ? def : v === 'true';
};

const PreferenciasTab = () => {
  const [compact,  setCompact]  = useState(() => readPref('pinca-compact', false));
  const [notifs,   setNotifs]   = useState(() => readPref('pinca-notifs', true));
  const [densidad, setDensidad] = useState(() => readPref('pinca-dense-sidebar', false));
  const avatarKey = useAvatarKey();
  const { mode: themeMode, setTheme } = useTheme();

  const themeOptions = [
    { key: 'light',  label: 'Claro',   icon: Sun,     desc: 'Tema claro siempre.' },
    { key: 'dark',   label: 'Oscuro',  icon: Moon,    desc: 'Tema oscuro siempre.' },
    { key: 'system', label: 'Sistema', icon: Monitor, desc: 'Sigue tu sistema operativo.' },
  ];

  const pickTheme = (key) => {
    setTheme(key);
    const found = themeOptions.find(o => o.key === key);
    toast.success(`Tema: ${found?.label ?? key}`);
  };

  const pickAvatar = (key) => {
    setStoredAvatarKey(key);
    const found = AVATAR_PALETTE.find(p => p.key === key);
    toast.success(`Color del avatar: ${found?.name ?? key}`);
  };

  const toggleCompact = () => {
    const next = !compact;
    setCompact(next);
    localStorage.setItem('pinca-compact', next);
    document.documentElement.classList.toggle('pinca-compact', next);
    toast.success(next ? 'Vista compacta activada' : 'Vista compacta desactivada');
  };

  const toggleNotifs = () => {
    const next = !notifs;
    setNotifs(next);
    localStorage.setItem('pinca-notifs', next);
    toast.success(next ? 'Notificaciones activadas' : 'Notificaciones silenciadas');
  };

  const toggleDensidad = () => {
    const next = !densidad;
    setDensidad(next);
    localStorage.setItem('pinca-dense-sidebar', next);
    toast.success(next ? 'Sidebar en modo denso' : 'Sidebar en modo normal');
  };

  const prefs = [
    {
      icon: Rows3, title: 'Vista compacta', desc: 'Reduce el espaciado en tablas y listas.',
      checked: compact, toggle: toggleCompact,
    },
    {
      icon: Bell, title: 'Notificaciones del sistema', desc: 'Muestra alertas de éxito y error en pantalla.',
      checked: notifs, toggle: toggleNotifs,
    },
    {
      icon: Maximize2, title: 'Sidebar denso', desc: 'Muestra más ítems en la barra lateral.',
      checked: densidad, toggle: toggleDensidad,
    },
  ];

  return (
    <div className="flex flex-col gap-5 p-5">
      <div>
        <SectionTitle icon={Sun}>Tema</SectionTitle>
        <div className="rounded-xl border border-border-subtle p-3">
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map(({ key, label, icon: Icon, desc }) => {
              const active = themeMode === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => pickTheme(key)}
                  title={desc}
                  className={`group relative flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all border ${
                    active
                      ? 'bg-surface-muted border-content-primary ring-2 ring-content-primary/20'
                      : 'bg-surface-base border-border-subtle hover:bg-surface-subtle hover:border-border-base'
                  }`}
                >
                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    active ? 'bg-content-primary text-content-inverse' : 'bg-surface-muted text-content-secondary'
                  }`}>
                    <Icon size={16} />
                  </span>
                  <span className={`text-xs font-medium ${active ? 'text-content-primary' : 'text-content-secondary'}`}>
                    {label}
                  </span>
                  {active && (
                    <span className="absolute top-1.5 right-1.5 text-content-primary">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-content-muted mt-2.5">
            “Sistema” usa la preferencia de tu sistema operativo y se actualiza automáticamente.
          </p>
        </div>
      </div>

      <div>
        <SectionTitle icon={Settings2}>Apariencia y comportamiento</SectionTitle>
        <div className="rounded-xl border border-border-subtle divide-y divide-border-subtle overflow-hidden">
          {prefs.map(({ icon: Icon, title, desc, checked, toggle }) => (
            <div key={title} className="flex items-center justify-between px-4 py-3 hover:bg-surface-subtle transition-colors">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-surface-muted flex items-center justify-center text-content-tertiary shrink-0 mt-0.5">
                  <Icon size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-content-secondary">{title}</p>
                  <p className="text-xs text-content-muted">{desc}</p>
                </div>
              </div>
              <div className="ml-4 shrink-0">
                <Toggle checked={checked} onChange={toggle} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle icon={Palette}>Color del avatar</SectionTitle>
        <div className="rounded-xl border border-border-subtle p-4">
          <p className="text-xs text-content-tertiary mb-3">
            Personaliza el color de tu avatar de usuario. Se aplica en el panel superior y la cabecera de este panel.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {AVATAR_PALETTE.map(p => {
              const active = avatarKey === p.key;
              return (
                <button key={p.key} type="button" onClick={() => pickAvatar(p.key)}
                  title={p.name}
                  className={`group relative flex flex-col items-center gap-1.5 rounded-xl p-2 transition-all ${
                    active ? 'bg-surface-muted ring-2 ring-content-primary' : 'hover:bg-surface-subtle ring-1 ring-transparent'
                  }`}>
                  <span className={`w-10 h-10 rounded-xl bg-linear-to-br ${p.preview} shadow-sm flex items-center justify-center text-white`}>
                    {active && <Check size={16} strokeWidth={3} />}
                  </span>
                  <span className={`text-[10px] font-medium ${active ? 'text-content-primary' : 'text-content-tertiary'}`}>
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <SectionTitle icon={Bell}>Notificaciones</SectionTitle>
        <div className="rounded-xl border border-border-subtle divide-y divide-border-subtle overflow-hidden">
          {[
            { title: 'Errores de conexión',  desc: 'Alertas cuando falla una petición al servidor.',  checked: true },
            { title: 'Confirmación de acciones', desc: 'Al guardar, eliminar o actualizar registros.', checked: true },
          ].map(({ title, desc }) => (
            <div key={title} className="flex items-center justify-between px-4 py-3 hover:bg-surface-subtle transition-colors">
              <div>
                <p className="text-sm font-medium text-content-secondary">{title}</p>
                <p className="text-xs text-content-muted">{desc}</p>
              </div>
              <div className={`ml-4 shrink-0 flex items-center gap-1.5 text-xs ${notifs ? 'text-semantic-success-fg' : 'text-content-muted'}`}>
                {notifs ? <Bell size={12} /> : <BellOff size={12} />}
                {notifs ? 'Activo' : 'Silenciado'}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-content-muted mt-2">
          Las preferencias se guardan en este navegador. Se perderán si limpias el almacenamiento local.
        </p>
      </div>
    </div>
  );
};

// ─── TAB: Roles y Permisos ────────────────────────────────────────────────────
const RolesTab = () => {
  const [subTab, setSubTab] = useState('modulos');

  return (
    <div className="flex flex-col">
      <div className="flex gap-1 px-4 pt-3 border-b border-border-subtle">
        {[{ key: 'modulos', label: 'Módulos por rol' }, { key: 'usuarios', label: 'Usuarios' }].map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)}
            className={`px-3 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px ${
              subTab === t.key ? 'border-content-primary text-content-primary' : 'border-transparent text-content-muted hover:text-content-secondary'
            }`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-4 overflow-y-auto">
        {subTab === 'modulos'  && <ModulosMatrix />}
        {subTab === 'usuarios' && <UsuariosRoles />}
      </div>
    </div>
  );
};

const ModulosMatrix = () => {
  const { data: permisos, isLoading } = usePermisos();
  const { mutate: updatePermisos, isPending } = useUpdatePermisos();
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState({});
  const [seededPermisos, setSeededPermisos] = useState(null);

  // Sembrar/re-sembrar el draft desde el servidor en render (sin setState-in-effect
  // ni refs). Re-siembra cuando `permisos` cambia de referencia (p. ej. tras guardar,
  // que invalida la query) SOLO si no hay filas con cambios sin guardar → refleja la
  // verdad del servidor sin pisar ediciones en curso de otros roles.
  const anyDirty = Object.values(dirty).some(Boolean);
  if (permisos && permisos !== seededPermisos && !anyDirty) {
    setSeededPermisos(permisos);
    setDraft(permisos);
  }
  if (isLoading) return <p className="text-xs text-content-muted">Cargando…</p>;
  if (!draft)    return null;

  const toggle = (rol, key) => {
    if (ROLES_LOCKEADOS.includes(rol)) return;
    setDraft(p => { const l = p[rol]??[]; return {...p,[rol]:l.includes(key)?l.filter(m=>m!==key):[...l,key]}; });
    setDirty(p => ({...p,[rol]:true}));
  };
  const save = (rol) => updatePermisos({rol, modulos: draft[rol]}, {onSuccess: () => setDirty(p=>({...p,[rol]:false}))});
  const grupos = [...new Set(MODULOS_SISTEMA.map(m => m.grupo))];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] text-content-muted">
        Superadmin y Admin tienen acceso total (no editable). Cambios se aplican
        inmediatamente — la sesión del usuario afectado se invalida.
      </p>
      <div className="grid grid-cols-[1fr_repeat(4,44px)] gap-x-2 px-1 items-end">
        <span />
        {ROLES.map(rol => (
          <div key={rol} className="flex flex-col items-center gap-1 pb-1">
            <span className="text-[9px] font-bold text-content-muted uppercase tracking-wide">{ROLES_LABELS[rol]?.slice(0,4)}</span>
            {!ROLES_LOCKEADOS.includes(rol) && dirty[rol] && (
              <button onClick={() => save(rol)} disabled={isPending}
                className="text-[9px] bg-semantic-success text-white px-1.5 py-0.5 rounded-full">Guardar</button>
            )}
          </div>
        ))}
      </div>
      {grupos.map(grupo => (
        <div key={grupo}>
          <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest mb-1 px-1">{grupo}</p>
          <div className="rounded-xl border border-border-subtle overflow-hidden">
            {MODULOS_SISTEMA.filter(m => m.grupo === grupo).map((mod, i, arr) => (
              <div key={mod.key} className={`grid grid-cols-[1fr_repeat(4,44px)] gap-x-2 items-center px-3 py-2 ${i < arr.length-1 ? 'border-b border-border-subtle':''} hover:bg-surface-subtle`}>
                <span className="text-xs text-content-secondary">{mod.label}</span>
                {ROLES.map(rol => {
                  const locked = ROLES_LOCKEADOS.includes(rol);
                  // Roles lockeados: muestro el toggle siempre como "on" (acceso total).
                  const checked = locked ? true : (draft[rol] ?? []).includes(mod.key);
                  return (
                    <div key={rol} className="flex justify-center">
                      <Toggle checked={checked} onChange={() => toggle(rol, mod.key)} disabled={locked} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const UsuariosRoles = () => {
  const { data: usuarios, isLoading } = useUsuariosRoles();
  const { mutate: cambiarRol, isPending } = useCambiarRol();
  const openConfirm = useBoundStore(s => s.openConfirm);
  const currentUserId = useBoundStore(s => s.user?.id);

  if (isLoading) return <p className="text-xs text-content-muted">Cargando…</p>;

  const handleChange = (usuario, nuevoRol) => {
    if (nuevoRol === usuario.rol) return;
    // Confirmación extra para promociones a admin/superadmin — son acciones
    // con impacto grande. Para downgrade (operador/visor) no necesita confirm.
    if (['superadmin', 'admin'].includes(nuevoRol)) {
      openConfirm({
        title:   `Promover a ${ROLES_LABELS[nuevoRol]}`,
        message: `¿Confirmás darle rol de ${ROLES_LABELS[nuevoRol]} a ${usuario.nombre || usuario.username}? Va a tener permisos amplios sobre el sistema.`,
        variant: 'warning',
        onConfirm: () => cambiarRol({ userId: usuario.id_usuarios, rol: nuevoRol }),
      });
    } else {
      cambiarRol({ userId: usuario.id_usuarios, rol: nuevoRol });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] text-content-muted">
        El cambio de rol invalida la sesión activa del usuario — al próximo
        request del frontend caerá al login.
      </p>
      <div className="rounded-xl border border-border-subtle overflow-hidden">
        {(usuarios??[]).map((u, i, arr) => {
          const esYoMismo = currentUserId && u.id_usuarios === currentUserId;
          return (
            <div key={u.id_usuarios}
              className={`flex items-center justify-between px-3 py-2.5 ${i < arr.length-1 ? 'border-b border-border-subtle':''} hover:bg-surface-subtle`}>
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7 h-7 rounded-full bg-linear-to-br ${(ROL_STYLES[u.rol]??ROL_STYLES.visor).grad} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                  {getInitials(u.nombre, u.username)}
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-medium text-content-secondary truncate">
                    {u.nombre || u.username}
                    {esYoMismo && <span className="ml-1.5 text-[9px] text-content-muted">(vos)</span>}
                  </span>
                  {u.nombre && (
                    <span className="block text-[10px] text-content-muted font-mono truncate">@{u.username}</span>
                  )}
                </div>
              </div>
              <select value={u.rol} disabled={isPending || esYoMismo}
                onChange={e => handleChange(u, e.target.value)}
                title={esYoMismo ? 'No podés cambiar tu propio rol' : undefined}
                className="border border-border-base rounded-lg px-2 py-1 text-xs bg-surface-base text-content-secondary focus:outline-none focus:ring-1 focus:ring-brand-primary/30 disabled:opacity-60 disabled:cursor-not-allowed">
                {ROLES.map(r => <option key={r} value={r}>{ROLES_LABELS[r]}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Panel principal ───────────────────────────────────────────────────────────
const UserPanel = () => {
  const activeDrawer = useBoundStore(s => s.activeDrawer);
  const closeDrawer  = useBoundStore(s => s.closeDrawer);
  const logout       = useBoundStore(s => s.logout);
  const user         = useBoundStore(s => s.user);
  const token        = useBoundStore(s => s.token);
  const navigate     = useNavigate();

  const isOpen        = activeDrawer === 'USER_PANEL';
  const isSuperadmin  = user?.rol === 'superadmin';
  const isAdminAccess = isSuperadmin || user?.rol === 'admin'; // admin + superadmin
  const [tab, setTab] = useState('cuenta');
  const headerGrad = useAvatarGradient(user?.rol);

  // Aplicar preferencia de modo compacto al montar
  useEffect(() => {
    const compact = localStorage.getItem('pinca-compact') === 'true';
    document.documentElement.classList.toggle('pinca-compact', compact);
  }, []);

  const handleLogout = useCallback(() => {
    closeDrawer();
    logout();
    navigate('/login', { replace: true });
  }, [closeDrawer, logout, navigate]);

  const TABS = [
    { key: 'cuenta',      label: 'Mi Cuenta',  icon: UserCircle },
    { key: 'seguridad',   label: 'Seguridad',  icon: History    },
    { key: 'prefs',       label: 'Ajustes',    icon: Settings2  },
    // Tabs admin (admin + superadmin). Los datos de empresa viven en
    // Configuración → Empresa, por eso ya no se duplica esa tab acá.
    ...(isAdminAccess ? [
      { key: 'salud',     label: 'Salud',      icon: HeartPulse },
    ] : []),
    // Tab exclusiva de superadmin: gestión de roles
    ...(isSuperadmin ? [
      { key: 'roles',     label: 'Roles',      icon: ShieldCheck },
    ] : []),
  ];

  return (
    <>
      {/* Overlay */}
      <div onClick={closeDrawer}
        className={`fixed inset-0 bg-surface-overlay z-100 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`} />

      {/* Panel */}
      <div className={`fixed right-0 top-0 h-full z-101 flex flex-col bg-surface-base shadow-2xl transition-transform duration-300 ease-in-out w-full sm:w-[50vw] sm:min-w-125 sm:max-w-225 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl bg-linear-to-br ${headerGrad} flex items-center justify-center text-white text-xs font-bold`}>
              {getInitials(user?.nombre, user?.username)}
            </div>
            <div>
              <p className="text-sm font-semibold text-content-primary leading-none">{user?.nombre || user?.username}</p>
              <p className="text-[10px] text-content-muted mt-0.5">{ROLES_LABELS[user?.rol] ?? user?.rol}</p>
            </div>
          </div>
          <button onClick={closeDrawer} aria-label="Cerrar"
            className="p-1.5 rounded-lg hover:bg-surface-muted text-content-muted hover:text-content-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-subtle shrink-0 overflow-x-auto no-scrollbar">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap -mb-px ${
                  tab === t.key
                    ? 'border-content-primary text-content-primary'
                    : 'border-transparent text-content-muted hover:text-content-secondary'
                }`}>
                <Icon size={13} />{t.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'cuenta'    && <MiCuentaTab    user={user} token={token} onLogout={handleLogout} />}
          {tab === 'seguridad' && <SeguridadTab   user={user} />}
          {tab === 'prefs'     && <PreferenciasTab />}
          {tab === 'roles'     && <RolesTab />}
          {tab === 'salud'     && (
            <div className="p-5">
              <SaludSistemaPage embedded onNavigate={closeDrawer} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserPanel;
