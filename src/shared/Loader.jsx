export const FullPageLoader = ({ message = "Cargando sección" }) => {
  return (
    <div className="flex-1 z-40 min-h-full flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
      <div className="relative">
        {/* Círculo de fondo */}
        <div className="h-12 w-12 rounded-full border-4 border-zinc-200"></div>
        {/* Spinner animado - Usamos emerald-500 para que combine con el resto */}
        <div className="absolute top-0 h-12 w-12 rounded-full border-4 border-transparent border-b-black animate-spin"></div>
      </div>
      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">
        {message}
      </p>
    </div>
  )
}

export const ComponentLoader = ({ name }) => {
  return (
    <div className="w-full py-12 flex flex-col items-center justify-center space-y-3">
      <div className="h-8 w-8 rounded-full border-2 border-zinc-100 border-b-zinc-800 animate-spin"></div>
      <p className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest">
        Preparando {name}...
      </p>
    </div>
  )
}

export const MiniLoader = () => (
  <div className="h-4 w-4 border-2 border-zinc-300 border-b-white rounded-full animate-spin inline-block"></div>
)