import { useState } from 'react';
import { useNavigate } from 'react-router';
import PincaLogo from '../../assets/pincaicono.png';
import PincaLetters from '../../assets/pincaLetters.png';
import apiClient from '../../api/apiClient';
import { API_ROUTES } from '../../api/apiRoutes';
import { useBoundStore } from '../../store/useBoundStore';
import { Button } from '../../shared/Button';
import { FormInput } from '../../shared/Form/FormInput';

export const Login = () => {
  const navigate = useNavigate();
  const setAuth = useBoundStore((s) => s.setAuth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Por favor ingresa usuario y contraseña.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post(API_ROUTES.AUTH.LOGIN, { username, password });
      if (!res.ok) {
        setError(res.msg || 'Usuario o contraseña incorrectos.');
        return;
      }
      setAuth(res.token, res.usuario);
      navigate('/', { replace: true });
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-subtle">
      {/* Panel izquierdo — branding */}
      <div className="w-1/2 hidden md:flex items-center justify-center flex-col bg-surface-sidebar p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, var(--brand-primary) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
        <img
          src={PincaLogo}
          alt="Pinca"
          className="relative w-2/3 max-w-sm drop-shadow-2xl"
        />
        <h2 className="relative text-content-inverse text-xl font-bold uppercase tracking-tight mt-6 text-center">
          Pinturas Industriales del Caribe S.A.S.
        </h2>
        <p className="relative text-content-muted text-xs mt-2 uppercase tracking-wider">
          Sistema de gestión integral
        </p>
      </div>

      {/* Panel derecho — login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md bg-surface-base rounded-2xl shadow-xl border border-border-base p-8 space-y-6">
          <img
            className="w-48 mx-auto"
            src={PincaLetters}
            alt="Pinca"
          />

          <div className="text-center">
            <h1 className="text-lg font-bold text-content-primary">Bienvenido</h1>
            <p className="text-xs text-content-tertiary mt-1">Inicia sesión para continuar</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormInput
              label="Usuario"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
              placeholder="Nombre de usuario"
            />

            <FormInput
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
              placeholder="••••••••"
            />

            {error && (
              <div className="bg-semantic-danger-subtle border border-semantic-danger/15 rounded-md px-3 py-2 text-xs text-semantic-danger-fg text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="dark"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Ingresar
            </Button>

            <p className="text-xs text-center text-content-tertiary pt-2">
              ¿Problemas para acceder? Contacta al administrador.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
