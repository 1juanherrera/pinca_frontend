import { useState, useEffect } from 'react';
import { ShieldCheck, Save, Users, RefreshCw } from 'lucide-react';
import HeaderSection from '../../shared/HeaderSection';
import { MODULOS_SISTEMA, ROLES_LABELS } from '../../config/modulos';
import { usePermisos, useUpdatePermisos, useUsuariosRoles, useCambiarRol } from './api/useRoles';

const ROLES = ['admin', 'operador', 'visor'];

// ── Componente toggle ─────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
      disabled
        ? 'bg-zinc-200 cursor-not-allowed opacity-60'
        : checked
        ? 'bg-emerald-500 cursor-pointer'
        : 'bg-zinc-300 cursor-pointer'
    }`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
        checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
      }`}
    />
  </button>
);

// ── Sección de permisos por módulo ────────────────────────────────────────────
const PermisosSection = () => {
  const { data: permisos, isLoading } = usePermisos();
  const { mutate: updatePermisos, isPending } = useUpdatePermisos();

  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState({});

  useEffect(() => {
    if (permisos) setDraft(permisos);
  }, [permisos]);

  if (isLoading || !draft) {
    return <div className="text-sm text-zinc-400">Cargando permisos…</div>;
  }

  const toggle = (rol, moduloKey) => {
    if (rol === 'admin') return; // admin no editable
    setDraft(prev => {
      const actual = prev[rol] ?? [];
      const next = actual.includes(moduloKey)
        ? actual.filter(m => m !== moduloKey)
        : [...actual, moduloKey];
      return { ...prev, [rol]: next };
    });
    setDirty(prev => ({ ...prev, [rol]: true }));
  };

  const save = (rol) => {
    updatePermisos({ rol, modulos: draft[rol] }, {
      onSuccess: () => setDirty(prev => ({ ...prev, [rol]: false })),
    });
  };

  // Agrupar módulos por grupo
  const grupos = [...new Set(MODULOS_SISTEMA.map(m => m.grupo))];

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50">
            <th className="px-4 py-3 text-left font-semibold text-zinc-600 w-52">Módulo</th>
            {ROLES.map(rol => (
              <th key={rol} className="px-4 py-3 text-center font-semibold text-zinc-600 w-36">
                <div className="flex flex-col items-center gap-0.5">
                  <span>{ROLES_LABELS[rol]}</span>
                  {rol !== 'admin' && dirty[rol] && (
                    <button
                      onClick={() => save(rol)}
                      disabled={isPending}
                      className="flex items-center gap-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-0.5 rounded-full mt-1 transition-colors disabled:opacity-60"
                    >
                      <Save size={10} />
                      Guardar
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grupos.map(grupo => (
            <>
              <tr key={`grupo-${grupo}`} className="bg-zinc-50/60">
                <td colSpan={4} className="px-4 py-1.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {grupo}
                </td>
              </tr>
              {MODULOS_SISTEMA.filter(m => m.grupo === grupo).map(modulo => (
                <tr key={modulo.key} className="border-t border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <td className="px-4 py-2.5 text-zinc-700 font-medium">{modulo.label}</td>
                  {ROLES.map(rol => {
                    const habilitado = (draft[rol] ?? []).includes(modulo.key);
                    return (
                      <td key={rol} className="px-4 py-2.5 text-center">
                        <div className="flex justify-center">
                          <Toggle
                            checked={habilitado}
                            onChange={() => toggle(rol, modulo.key)}
                            disabled={rol === 'admin'}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-2.5 text-xs text-zinc-400 border-t border-zinc-100">
        El rol <strong>Administrador</strong> siempre tiene acceso a todos los módulos y no es editable.
        Los cambios aplican en el próximo inicio de sesión.
      </div>
    </div>
  );
};

// ── Sección de usuarios y sus roles ──────────────────────────────────────────
const UsuariosSection = () => {
  const { data: usuarios, isLoading } = useUsuariosRoles();
  const { mutate: cambiarRol, isPending } = useCambiarRol();

  if (isLoading) return <div className="text-sm text-zinc-400">Cargando usuarios…</div>;

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-100 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50">
            <th className="px-4 py-3 text-left font-semibold text-zinc-600">ID</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-600">Usuario</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-600">Rol actual</th>
            <th className="px-4 py-3 text-left font-semibold text-zinc-600">Cambiar rol</th>
          </tr>
        </thead>
        <tbody>
          {(usuarios ?? []).map(u => (
            <tr key={u.id_usuarios} className="border-t border-zinc-50 hover:bg-zinc-50/50">
              <td className="px-4 py-2.5 text-zinc-400 text-xs">{u.id_usuarios}</td>
              <td className="px-4 py-2.5 font-medium text-zinc-700">{u.username}</td>
              <td className="px-4 py-2.5">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                  u.rol === 'admin'    ? 'bg-violet-100 text-violet-700' :
                  u.rol === 'operador' ? 'bg-blue-100 text-blue-700' :
                                        'bg-zinc-100 text-zinc-600'
                }`}>
                  {ROLES_LABELS[u.rol] ?? u.rol}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <select
                  defaultValue={u.rol}
                  disabled={isPending}
                  onChange={(e) => cambiarRol({ userId: u.id_usuarios, rol: e.target.value })}
                  className="border border-zinc-200 rounded-lg px-2 py-1 text-sm bg-white text-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:opacity-60"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{ROLES_LABELS[r]}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Página principal ──────────────────────────────────────────────────────────
const RolesPage = () => {
  const [tab, setTab] = useState('permisos');

  return (
    <div className="flex flex-col w-full gap-4">
      <HeaderSection
        title="Roles y Permisos"
        subtitle="Administración"
        icon={ShieldCheck}
        breadcrumbs={[{ label: 'Administración' }, { label: 'Roles y Permisos' }]}
      />

      <div className="flex gap-1 border-b border-zinc-100">
        <button
          onClick={() => setTab('permisos')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'permisos'
              ? 'border-zinc-800 text-zinc-800'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <ShieldCheck size={15} />
          Módulos por rol
        </button>
        <button
          onClick={() => setTab('usuarios')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === 'usuarios'
              ? 'border-zinc-800 text-zinc-800'
              : 'border-transparent text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Users size={15} />
          Usuarios
        </button>
      </div>

      {tab === 'permisos' && <PermisosSection />}
      {tab === 'usuarios' && <UsuariosSection />}
    </div>
  );
};

export default RolesPage;
