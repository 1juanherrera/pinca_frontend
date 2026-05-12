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
