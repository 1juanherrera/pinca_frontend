import PincaLogo from '../assets/pincaicono.png';

/**
 * SessionLoader — pantalla completa on-brand para la verificación de sesión.
 * Logo Pinca con halo pulsante + arco giratorio amarillo + orbes de marca al
 * fondo (continuidad visual con el Login).
 */
export const SessionLoader = ({ message = 'Verificando sesión' }) => (
  <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-7 overflow-hidden bg-surface-subtle">
    {/* Orbes de marca sutiles */}
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute -top-24 left-1/4 h-80 w-80 rounded-full bg-brand-primary/10 blur-3xl" />
      <div className="absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-brand-primary/[0.07] blur-3xl" />
    </div>

    {/* Logo + arco giratorio */}
    <div className="relative flex h-28 w-28 items-center justify-center">
      <div className="absolute h-24 w-24 rounded-full bg-brand-primary/20 blur-2xl animate-pulse" />
      <svg
        className="absolute h-28 w-28 animate-spin"
        style={{ animationDuration: '1.1s' }}
        viewBox="0 0 100 100"
        fill="none"
      >
        <circle cx="50" cy="50" r="45" className="stroke-border-base" strokeWidth="3" opacity="0.5" />
        <circle
          cx="50"
          cy="50"
          r="45"
          className="stroke-brand-primary"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="70 220"
        />
      </svg>
      <img src={PincaLogo} alt="Pinca" className="relative h-14 w-auto drop-shadow-lg" />
    </div>

    {/* Mensaje + puntos animados */}
    <div className="relative flex items-center gap-2 text-content-tertiary">
      <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">{message}</span>
      <span className="flex items-center gap-1">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 rounded-full bg-brand-primary animate-bounce"
            style={{ animationDelay: `${delay}ms`, animationDuration: '0.9s' }}
          />
        ))}
      </span>
    </div>
  </div>
);

export const FullPageLoader = ({ message = 'Cargando sección' }) => (
  <div className="flex-1 min-h-full flex flex-col items-center justify-center gap-4">
    <div className="relative">
      <div className="h-10 w-10 rounded-full border-2 border-border-base" />
      <div className="absolute top-0 h-10 w-10 rounded-full border-2 border-transparent border-b-content-primary animate-spin" />
    </div>
    <p className="text-content-tertiary text-[10px] font-semibold uppercase tracking-[0.2em] animate-pulse">
      {message}
    </p>
  </div>
);

export const ComponentLoader = ({ name }) => (
  <div className="w-full py-10 flex flex-col items-center justify-center space-y-3">
    <div className="h-7 w-7 rounded-full border-2 border-border-subtle border-b-content-primary animate-spin" />
    <p className="text-content-muted text-[10px] font-semibold uppercase tracking-wider">
      Preparando {name}...
    </p>
  </div>
);

export const MiniLoader = () => (
  <div className="h-3.5 w-3.5 border-2 border-border-base border-b-content-inverse rounded-full animate-spin inline-block" />
);
