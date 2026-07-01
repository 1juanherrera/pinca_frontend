import { useState } from 'react';
import { KeyRound, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useBoundStore } from '../store/useBoundStore';
import apiClient from '../api/apiClient';
import { API_ROUTES } from '../api/apiRoutes';
import { Button } from './Button';
import { INPUT_BASE } from './Form/styles';

/**
 * Modal forzado de cambio de password.
 *
 * Se muestra como overlay bloqueante cuando `user.password_must_change === 1`.
 * No se puede cerrar — el único exit es cambiar la contraseña exitosamente o
 * hacer logout.
 *
 * Lo monta `Layout` a nivel raíz para que aparezca antes que cualquier ruta.
 */
const ForceChangePasswordModal = () => {
  const user    = useBoundStore(s => s.user);
  const token   = useBoundStore(s => s.token);
  const setAuth = useBoundStore(s => s.setAuth);
  const logout  = useBoundStore(s => s.logout);

  const [current, setCurrent] = useState('');
  const [next, setNext]       = useState('');
  const [confirm, setConfirm] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  if (!user || user.password_must_change !== 1) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (next.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (next !== confirm) {
      setError('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (next === current) {
      setError('La nueva contraseña debe ser distinta de la actual.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.patch(API_ROUTES.AUTH.CAMBIAR_PASSWORD, {
        currentPassword: current,
        newPassword:     next,
      });
      // El backend incrementa token_version al cambiar password — usa el
      // token nuevo que vuelve en la respuesta para que esta sesión siga viva.
      const nuevoToken = res?.token ?? token;
      setAuth(nuevoToken, { ...user, password_must_change: 0 });
      toast.success('Contraseña actualizada. Bienvenido.');
    } catch (err) {
      const msg = err?.response?.data?.msg || 'No se pudo actualizar la contraseña.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] bg-surface-overlay backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-base rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8">
        {/* Hero */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-semantic-warning-subtle flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-semantic-warning-fg" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-content-primary leading-tight">
              Cambia tu contraseña
            </h2>
            <p className="text-sm text-content-tertiary mt-1">
              Por seguridad, debes definir una contraseña personal antes de continuar.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {/* Actual */}
          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">
              Contraseña actual
            </label>
            <input
              type="password"
              autoFocus
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className={INPUT_BASE}
              placeholder="La que usaste para iniciar sesión"
              required
            />
          </div>

          {/* Nueva */}
          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">
              Nueva contraseña
              <span className="text-content-muted font-normal ml-2">(mín. 8 caracteres)</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                className={INPUT_BASE + ' pr-10'}
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(s => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-content-muted hover:text-content-primary"
                tabIndex={-1}
              >
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Confirmar */}
          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">
              Repetir nueva contraseña
            </label>
            <input
              type={showNew ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={INPUT_BASE}
              required
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs text-semantic-danger-fg bg-semantic-danger-subtle/60 border border-semantic-danger/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="submit"
              variant="primary"
              icon={KeyRound}
              loading={loading}
              disabled={loading}
              className="flex-1"
            >
              Cambiar contraseña
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={logout}
              disabled={loading}
            >
              Cerrar sesión
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default ForceChangePasswordModal;
