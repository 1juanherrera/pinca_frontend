import { useState } from 'react';
import { useBoundStore } from '../../store/useBoundStore';
import { MODULOS_SISTEMA, ROLES_LABELS } from '../../config/modulos';
import { usePermisos, useUpdatePermisos, useUsuariosRoles, useCambiarRol } from '../../modules/Roles/api/useRoles';
import { ROL_STYLES } from '../../utils/avatarTheme';
import { Toggle } from './atoms';
import { ROLES, ROLES_LOCKEADOS, getInitials } from './constants';

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

export default RolesTab;
