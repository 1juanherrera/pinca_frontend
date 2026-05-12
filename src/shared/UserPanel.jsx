import { useState, useEffect, useCallback } from 'react';
import {
  X, KeyRound, Eye, EyeOff, LogOut, ShieldCheck, UserCircle,
  CheckCircle2, Clock, History, Settings2, Building2, Save,
  Globe, Phone, MapPin, FileText, Hash, AlertCircle, Bell,
  BellOff, Rows3, Maximize2,
} from 'lucide-react';
import { useBoundStore }  from '../store/useBoundStore';
import { useNavigate }    from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient           from '../api/apiClient';
import { API_ROUTES }      from '../api/apiRoutes';
import toast               from 'react-hot-toast';
import { MODULOS_SISTEMA, ROLES_LABELS } from '../config/modulos';
import { usePermisos, useUpdatePermisos, useUsuariosRoles, useCambiarRol } from '../modules/Roles/api/useRoles';

// ─── Constantes ───────────────────────────────────────────────────────────────
const ROLES = ['admin', 'operador', 'visor'];

const ROL_STYLES = {
  admin:    { grad: 'from-violet-500 to-purple-600', badge: 'bg-violet-100 text-violet-700' },
  operador: { grad: 'from-blue-500   to-cyan-600',   badge: 'bg-blue-100   text-blue-700'   },
  visor:    { grad: 'from-zinc-500   to-zinc-600',   badge: 'bg-zinc-100   text-zinc-600'   },
};

const getInitials  = (u = '') => u.slice(0, 2).toUpperCase();
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
      disabled ? 'opacity-40 cursor-not-allowed bg-zinc-200'
      : checked  ? 'bg-emerald-500 cursor-pointer'
                 : 'bg-zinc-300 cursor-pointer'
    }`}
  >
    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
      checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
    }`} />
  </button>
);

const SectionTitle = ({ icon: Icon, children }) => (
  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
    <Icon size={11} />{children}
  </p>
);

const FieldInput = ({ label, value, onChange, icon: Icon, placeholder, type = 'text' }) => (
  <div>
    <label className="flex items-center gap-1 text-xs text-zinc-500 mb-1">{Icon && <Icon size={11} />}{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-zinc-50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:bg-white transition-all" />
  </div>
);

// ─── TAB: Mi Cuenta ───────────────────────────────────────────────────────────
const MiCuentaTab = ({ user, token, onLogout }) => {
  const [countdown, setCountdown] = useState(0);
  const [pctUsed,   setPctUsed]   = useState(0);
  const [show, setShow]  = useState({ curr: false, next: false, conf: false });
  const [form, setForm]  = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [ok,   setOk]    = useState(false);

  const rol   = user?.rol  ?? 'visor';
  const style = ROL_STYLES[rol] ?? ROL_STYLES.visor;
  const modulos = user?.modulos ?? [];

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

  const { mutate: cambiarPwd, isPending } = useMutation({
    mutationFn: (body) => apiClient.patch(API_ROUTES.AUTH.CAMBIAR_PASSWORD, body),
    onSuccess: () => { toast.success('Contraseña actualizada'); setForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setOk(true); setTimeout(() => setOk(false), 3000); },
    onError: (e) => toast.error(e?.response?.data?.msg || 'Contraseña actual incorrecta'),
  });

  const handlePwd = (e) => {
    e.preventDefault();
    if (form.newPassword.length < 8) return toast.error('Mínimo 8 caracteres.');
    if (form.newPassword !== form.confirmPassword) return toast.error('Las contraseñas no coinciden.');
    cambiarPwd({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  };

  const modulosPorGrupo = MODULOS_SISTEMA.reduce((acc, m) => {
    if (!modulos.includes(m.key)) return acc;
    (acc[m.grupo] ??= []).push(m.label);
    return acc;
  }, {});

  const barColor = pctUsed < 50 ? 'bg-emerald-500' : pctUsed < 75 ? 'bg-yellow-400' : 'bg-red-500';

  return (
    <div className="flex flex-col gap-5 p-5 pb-4">

      {/* Avatar + info */}
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${style.grad} flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0`}>
          {getInitials(user?.username)}
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-zinc-800 truncate">{user?.username}</p>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.badge}`}>
            {ROLES_LABELS[rol] ?? rol}
          </span>
        </div>
      </div>

      {/* Sesión activa */}
      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
        <div className="flex items-center justify-between mb-2">
          <SectionTitle icon={Clock}>Sesión activa</SectionTitle>
          <span className={`text-[11px] font-mono font-semibold ${countdown < 1800 ? 'text-red-500' : 'text-zinc-500'}`}>
            {formatCountdown(countdown)}
          </span>
        </div>
        <div className="w-full h-1.5 bg-zinc-200 rounded-full overflow-hidden mb-2">
          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pctUsed}%` }} />
        </div>
        <p className="text-[11px] text-zinc-400">Inicio de sesión: <span className="text-zinc-600 font-medium">{loginAt}</span></p>
      </div>

      {/* Módulos */}
      {Object.keys(modulosPorGrupo).length > 0 && (
        <div>
          <SectionTitle icon={CheckCircle2}>Módulos con acceso</SectionTitle>
          <div className="flex flex-col gap-1.5">
            {Object.entries(modulosPorGrupo).map(([grupo, labels]) => (
              <div key={grupo} className="flex flex-wrap items-start gap-1.5">
                <span className="text-[10px] text-zinc-400 font-medium w-20 shrink-0 pt-0.5">{grupo}</span>
                <div className="flex flex-wrap gap-1">
                  {labels.map(label => (
                    <span key={label} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-zinc-100 text-zinc-600 rounded-full text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cambiar contraseña */}
      <div>
        <SectionTitle icon={KeyRound}>Cambiar contraseña</SectionTitle>
        <form onSubmit={handlePwd} className="flex flex-col gap-2.5">
          {[
            { key: 'currentPassword', label: 'Contraseña actual',          sk: 'curr' },
            { key: 'newPassword',     label: 'Nueva contraseña',            sk: 'next' },
            { key: 'confirmPassword', label: 'Confirmar nueva contraseña',  sk: 'conf' },
          ].map(({ key, label, sk }) => (
            <div key={key} className="relative">
              <label className="block text-xs text-zinc-500 mb-1">{label}</label>
              <div className="relative">
                <input type={show[sk] ? 'text' : 'password'} value={form[key]} required
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 pr-9 text-sm bg-zinc-50 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:bg-white transition-all" />
                <button type="button" onClick={() => setShow(s => ({ ...s, [sk]: !s[sk] }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                  {show[sk] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={isPending}
            className={`w-full py-2 rounded-lg text-sm font-semibold transition-all mt-1 ${
              ok ? 'bg-emerald-500 text-white' : 'bg-zinc-900 hover:bg-zinc-700 text-white disabled:opacity-60'
            }`}>
            {isPending ? 'Guardando…' : ok ? '¡Actualizada correctamente!' : 'Guardar contraseña'}
          </button>
        </form>
      </div>

      {/* Logout */}
      <button onClick={onLogout}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors text-sm font-medium">
        <LogOut size={15} /> Cerrar sesión
      </button>
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
        <div className="rounded-xl border border-zinc-100 divide-y divide-zinc-50 text-sm overflow-hidden">
          {[
            { label: 'Usuario',          value: user?.username },
            { label: 'Rol',              value: ROLES_LABELS[user?.rol] ?? user?.rol },
            { label: 'Inicio de sesión', value: loginAt },
            { label: 'Expira',           value: expDate },
            { label: 'Módulos',          value: `${user?.modulos?.length ?? 0} asignados` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center px-3 py-2.5 hover:bg-zinc-50 transition-colors">
              <span className="text-zinc-500">{label}</span>
              <span className="font-medium text-zinc-700">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Historial de accesos */}
      <div>
        <SectionTitle icon={History}>Últimos intentos de acceso</SectionTitle>
        {isLoading ? (
          <p className="text-xs text-zinc-400">Cargando historial…</p>
        ) : (data ?? []).length === 0 ? (
          <p className="text-xs text-zinc-400">Sin registros recientes.</p>
        ) : (
          <div className="rounded-xl border border-zinc-100 divide-y divide-zinc-50 overflow-hidden">
            {(data ?? []).map((row, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-zinc-700">{fmtDate(row.created_at)}</p>
                    <p className="text-[10px] text-zinc-400">IP: {maskIp(row.ip_address)}</p>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">Intento</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-zinc-400 mt-2">Se muestran los últimos 10 intentos registrados para tu usuario.</p>
      </div>

      {/* Info de seguridad */}
      <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 flex gap-2.5">
        <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
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
        <SectionTitle icon={Settings2}>Apariencia y comportamiento</SectionTitle>
        <div className="rounded-xl border border-zinc-100 divide-y divide-zinc-50 overflow-hidden">
          {prefs.map(({ icon: Icon, title, desc, checked, toggle }) => (
            <div key={title} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0 mt-0.5">
                  <Icon size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-700">{title}</p>
                  <p className="text-xs text-zinc-400">{desc}</p>
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
        <SectionTitle icon={Bell}>Notificaciones</SectionTitle>
        <div className="rounded-xl border border-zinc-100 divide-y divide-zinc-50 overflow-hidden">
          {[
            { title: 'Errores de conexión',  desc: 'Alertas cuando falla una petición al servidor.',  checked: true },
            { title: 'Confirmación de acciones', desc: 'Al guardar, eliminar o actualizar registros.', checked: true },
          ].map(({ title, desc, checked }) => (
            <div key={title} className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-zinc-700">{title}</p>
                <p className="text-xs text-zinc-400">{desc}</p>
              </div>
              <div className={`ml-4 shrink-0 flex items-center gap-1.5 text-xs ${notifs ? 'text-emerald-600' : 'text-zinc-400'}`}>
                {notifs ? <Bell size={12} /> : <BellOff size={12} />}
                {notifs ? 'Activo' : 'Silenciado'}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-zinc-400 mt-2">
          Las preferencias se guardan en este navegador. Se perderán si limpias el almacenamiento local.
        </p>
      </div>
    </div>
  );
};

// ─── TAB: Empresa ─────────────────────────────────────────────────────────────
const EmpresaTab = () => {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['empresa'],
    queryFn:  () => apiClient.get(API_ROUTES.EMPRESA.GET),
    select:   (r) => (Array.isArray(r) ? r[0] : r) ?? {},
  });

  const [form, setForm] = useState(null);

  useEffect(() => { if (data && !form) setForm(data); }, [data]);

  const { mutate: save, isPending } = useMutation({
    mutationFn: (body) => apiClient.put(API_ROUTES.EMPRESA.UPDATE, body),
    onSuccess: () => { toast.success('Datos de empresa actualizados'); qc.invalidateQueries({ queryKey: ['empresa'] }); },
    onError:   () => toast.error('Error al guardar'),
  });

  if (isLoading || !form) return <p className="p-5 text-sm text-zinc-400">Cargando datos de empresa…</p>;

  const FIELDS = [
    { key: 'razon_social', label: 'Razón social',  icon: Building2, placeholder: 'Nombre legal de la empresa' },
    { key: 'nit',          label: 'NIT',            icon: Hash,       placeholder: '000000000-0' },
    { key: 'ciudad',       label: 'Ciudad',         icon: MapPin,     placeholder: 'Ciudad' },
    { key: 'telefono',     label: 'Teléfono',       icon: Phone,      placeholder: '+57 300 000 0000' },
    { key: 'pagina_web',   label: 'Página web',     icon: Globe,      placeholder: 'https://ejemplo.com' },
    { key: 'descripcion',  label: 'Descripción',    icon: FileText,   placeholder: 'Breve descripción de la empresa', type: 'text' },
  ];

  return (
    <div className="flex flex-col gap-5 p-5">
      <SectionTitle icon={Building2}>Datos de la empresa</SectionTitle>

      <div className="grid grid-cols-1 gap-3">
        {FIELDS.map(({ key, label, icon, placeholder, type }) => (
          <FieldInput key={key} label={label} icon={icon} placeholder={placeholder} type={type ?? 'text'}
            value={form[key] ?? ''}
            onChange={val => setForm(f => ({ ...f, [key]: val }))}
          />
        ))}
      </div>

      <button onClick={() => save(form)} disabled={isPending}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
        <Save size={15} />
        {isPending ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </div>
  );
};

// ─── TAB: Roles y Permisos ────────────────────────────────────────────────────
const RolesTab = () => {
  const [subTab, setSubTab] = useState('modulos');

  return (
    <div className="flex flex-col">
      <div className="flex gap-1 px-4 pt-3 border-b border-zinc-100">
        {[{ key: 'modulos', label: 'Módulos por rol' }, { key: 'usuarios', label: 'Usuarios' }].map(t => (
          <button key={t.key} onClick={() => setSubTab(t.key)}
            className={`px-3 py-2 text-xs font-semibold transition-colors border-b-2 -mb-px ${
              subTab === t.key ? 'border-zinc-800 text-zinc-800' : 'border-transparent text-zinc-400 hover:text-zinc-600'
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

  useEffect(() => { if (permisos && !draft) setDraft(permisos); }, [permisos]);
  if (isLoading) return <p className="text-xs text-zinc-400">Cargando…</p>;
  if (!draft)    return null;

  const toggle = (rol, key) => {
    if (rol === 'admin') return;
    setDraft(p => { const l = p[rol]??[]; return {...p,[rol]:l.includes(key)?l.filter(m=>m!==key):[...l,key]}; });
    setDirty(p => ({...p,[rol]:true}));
  };
  const save = (rol) => updatePermisos({rol, modulos: draft[rol]}, {onSuccess: () => setDirty(p=>({...p,[rol]:false}))});
  const grupos = [...new Set(MODULOS_SISTEMA.map(m => m.grupo))];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] text-zinc-400">Admin siempre tiene todos los módulos. Cambios aplican en el próximo login.</p>
      <div className="grid grid-cols-[1fr_repeat(3,44px)] gap-x-2 px-1 items-end">
        <span />
        {ROLES.map(rol => (
          <div key={rol} className="flex flex-col items-center gap-1 pb-1">
            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">{ROLES_LABELS[rol]?.slice(0,4)}</span>
            {rol !== 'admin' && dirty[rol] && (
              <button onClick={() => save(rol)} disabled={isPending}
                className="text-[9px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">Guardar</button>
            )}
          </div>
        ))}
      </div>
      {grupos.map(grupo => (
        <div key={grupo}>
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1 px-1">{grupo}</p>
          <div className="rounded-xl border border-zinc-100 overflow-hidden">
            {MODULOS_SISTEMA.filter(m => m.grupo === grupo).map((mod, i, arr) => (
              <div key={mod.key} className={`grid grid-cols-[1fr_repeat(3,44px)] gap-x-2 items-center px-3 py-2 ${i < arr.length-1 ? 'border-b border-zinc-50':''} hover:bg-zinc-50`}>
                <span className="text-xs text-zinc-700">{mod.label}</span>
                {ROLES.map(rol => (
                  <div key={rol} className="flex justify-center">
                    <Toggle checked={(draft[rol]??[]).includes(mod.key)} onChange={() => toggle(rol, mod.key)} disabled={rol==='admin'} />
                  </div>
                ))}
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
  if (isLoading) return <p className="text-xs text-zinc-400">Cargando…</p>;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] text-zinc-400">Los cambios de rol aplican en el próximo inicio de sesión.</p>
      <div className="rounded-xl border border-zinc-100 overflow-hidden">
        {(usuarios??[]).map((u, i, arr) => (
          <div key={u.id_usuarios}
            className={`flex items-center justify-between px-3 py-2.5 ${i < arr.length-1 ? 'border-b border-zinc-50':''} hover:bg-zinc-50`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${(ROL_STYLES[u.rol]??ROL_STYLES.visor).grad} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                {getInitials(u.username)}
              </div>
              <span className="text-sm font-medium text-zinc-700 truncate">{u.username}</span>
            </div>
            <select defaultValue={u.rol} disabled={isPending}
              onChange={e => cambiarRol({userId: u.id_usuarios, rol: e.target.value})}
              className="border border-zinc-200 rounded-lg px-2 py-1 text-xs bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-300 disabled:opacity-60">
              {ROLES.map(r => <option key={r} value={r}>{ROLES_LABELS[r]}</option>)}
            </select>
          </div>
        ))}
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

  const isOpen  = activeDrawer === 'USER_PANEL';
  const isAdmin = user?.rol === 'admin';
  const [tab, setTab] = useState('cuenta');

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
    ...(isAdmin ? [
      { key: 'empresa',   label: 'Empresa',    icon: Building2  },
      { key: 'roles',     label: 'Roles',      icon: ShieldCheck },
    ] : []),
  ];

  return (
    <>
      {/* Overlay */}
      <div onClick={closeDrawer}
        className={`fixed inset-0 bg-black/40 z-[100] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`} />

      {/* Panel */}
      <div className={`fixed right-0 top-0 h-full z-[101] flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out w-full sm:w-[500px] ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${(ROL_STYLES[user?.rol]??ROL_STYLES.visor).grad} flex items-center justify-center text-white text-xs font-bold`}>
              {getInitials(user?.username)}
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-800 leading-none">{user?.username}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">{ROLES_LABELS[user?.rol] ?? user?.rol}</p>
            </div>
          </div>
          <button onClick={closeDrawer}
            className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-100 shrink-0 overflow-x-auto no-scrollbar">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors border-b-2 whitespace-nowrap -mb-px ${
                  tab === t.key
                    ? 'border-zinc-900 text-zinc-900'
                    : 'border-transparent text-zinc-400 hover:text-zinc-600'
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
          {tab === 'empresa'   && <EmpresaTab />}
          {tab === 'roles'     && <RolesTab />}
        </div>
      </div>
    </>
  );
};

export default UserPanel;
