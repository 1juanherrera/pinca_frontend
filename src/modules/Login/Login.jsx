import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  User, Lock, Eye, EyeOff, AlertCircle, ArrowRight,
  Sparkles, ShieldCheck, Boxes, LineChart,
} from 'lucide-react';
import PincaLogo from '../../assets/pincaicono.png';
import PincaLetters from '../../assets/pincaLetters.png';
import apiClient from '../../api/apiClient';
import { API_ROUTES } from '../../api/apiRoutes';
import { useBoundStore } from '../../store/useBoundStore';
import { Button } from '../../shared/Button';
import { INPUT_BASE } from '../../shared/Form/styles';
import cn from '../../utils/cn';

/* Campo con icono a la izquierda y slot opcional a la derecha (toggle de contraseña). */
const Field = ({ id, icon: Icon, rightSlot, error, className = '', ...props }) => (
  <div className="relative">
    <Icon
      size={16}
      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted"
    />
    <input
      id={id}
      className={cn(
        INPUT_BASE,
        'h-11 rounded-xl pl-10',
        rightSlot ? 'pr-11' : 'pr-3',
        error && 'border-semantic-danger focus:border-semantic-danger focus:ring-semantic-danger/20',
        className,
      )}
      {...props}
    />
    {rightSlot}
  </div>
);

const FEATURES = [
  { icon: ShieldCheck, label: 'Acceso protegido', desc: 'Sesiones cifradas y por rol' },
  { icon: Boxes, label: 'Inventario en vivo', desc: 'Stock al instante por bodega' },
  { icon: LineChart, label: 'Rentabilidad clara', desc: 'Costos y márgenes reales' },
];

export const Login = () => {
  const navigate = useNavigate();
  const setAuth = useBoundStore((s) => s.setAuth);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
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
    <div className="flex min-h-screen bg-surface-subtle text-content-primary">
      {/* ───────────────────── Panel izquierdo — branding inmersivo ───────────────────── */}
      <div className="relative hidden w-[55%] flex-col justify-between overflow-hidden bg-surface-sidebar p-12 text-content-inverse lg:flex">
        {/* Orbes de pintura flotantes */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 -top-24 h-96 w-96 rounded-full bg-brand-primary/30 blur-3xl animate-login-blob" />
          <div className="absolute -right-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-brand-primary-hover/20 blur-3xl animate-login-blob-slow" />
          <div className="absolute -bottom-28 left-1/4 h-80 w-80 rounded-full bg-brand-primary-active/25 blur-3xl animate-login-blob" />
        </div>

        {/* Grilla de puntos sutil */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
            backgroundSize: '26px 26px',
          }}
        />

        {/* Top — logo con halo + mensaje principal */}
        <div className="relative">
          <div className="animate-login-rise">
            <div className="relative inline-block">
              <div className="absolute inset-0 rounded-3xl bg-brand-primary/40 blur-2xl" />
              <img src={PincaLogo} alt="Pinca" className="relative h-28 w-auto drop-shadow-2xl" />
            </div>
          </div>

          <div className="mt-8 max-w-lg space-y-6">
          <span
            className="inline-flex items-center gap-2 rounded-pill border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-brand-primary backdrop-blur animate-login-rise"
            style={{ animationDelay: '120ms' }}
          >
            <Sparkles size={12} /> Sistema de gestión integral
          </span>

          <h1
            className="text-4xl font-bold leading-[1.15] tracking-tight animate-login-rise"
            style={{ animationDelay: '220ms' }}
          >
            Color, control y{' '}
            <span className="bg-gradient-to-r from-brand-primary via-white to-brand-primary bg-clip-text text-transparent animate-login-shimmer">
              precisión
            </span>{' '}
            en cada proceso.
          </h1>

          <p
            className="text-sm leading-relaxed text-content-muted animate-login-rise"
            style={{ animationDelay: '320ms' }}
          >
            Pinturas Industriales del Caribe S.A.S. — inventario, producción, cartera y
            rentabilidad conectados en una sola plataforma.
          </p>
          </div>
        </div>

        {/* Bottom — features */}
        <div
          className="relative grid grid-cols-3 gap-3 animate-login-rise"
          style={{ animationDelay: '420ms' }}
        >
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-primary/30 hover:bg-white/[0.07]"
            >
              <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/15 text-brand-primary ring-1 ring-brand-primary/20 transition-colors group-hover:bg-brand-primary group-hover:text-brand-on-primary">
                <Icon size={16} />
              </span>
              <p className="text-sm font-semibold text-content-inverse">{label}</p>
              <p className="mt-0.5 text-xs leading-snug text-content-muted">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ───────────────────── Panel derecho — formulario ───────────────────── */}
      <div className="relative flex w-full items-center justify-center px-6 py-10 lg:w-[45%]">
        {/* Glow de marca sutil al fondo */}
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-brand-primary/5 blur-3xl" />

        <div className="relative w-full max-w-md">
          {/* Logo letras (branding también en móvil) */}
          <div className="mb-8 flex justify-center animate-login-rise">
            <img src={PincaLetters} alt="Pinca" className="h-12 w-auto" />
          </div>

          {/* Card del formulario */}
          <div
            className="rounded-2xl border border-border-base bg-surface-base/90 p-8 shadow-xl backdrop-blur-sm animate-login-rise"
            style={{ animationDelay: '80ms' }}
          >
            <div className="mb-6 text-center">
              <h2 className="text-xl font-bold text-content-primary">Bienvenido de nuevo</h2>
              <p className="mt-1 text-sm text-content-tertiary">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="login-user" className="mb-1.5 block text-xs font-medium text-content-secondary">
                  Usuario
                </label>
                <Field
                  id="login-user"
                  icon={User}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                  placeholder="Nombre de usuario"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="login-pwd" className="mb-1.5 block text-xs font-medium text-content-secondary">
                  Contraseña
                </label>
                <Field
                  id="login-pwd"
                  icon={Lock}
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  rightSlot={
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPwd((v) => !v)}
                      aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted transition-colors hover:text-content-secondary"
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-semantic-danger/15 bg-semantic-danger-subtle px-3 py-2.5 text-xs text-semantic-danger-fg animate-in fade-in">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                iconRight={ArrowRight}
                className="mt-2 w-full shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0"
              >
                Iniciar sesión
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-content-tertiary">
            ¿Problemas para acceder? Contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
};
