import { useState } from 'react';
import {
  Rows3, Bell, BellOff, Maximize2, Palette, Check, Settings2, Sun, Moon, Monitor,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import toast from 'react-hot-toast';
import {
  AVATAR_PALETTE, useAvatarKey, setStoredAvatarKey,
} from '../../utils/avatarTheme';
import { SectionTitle, Toggle } from './atoms';
import { readPref } from './constants';

// ─── TAB: Preferencias ────────────────────────────────────────────────────────
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

export default PreferenciasTab;
