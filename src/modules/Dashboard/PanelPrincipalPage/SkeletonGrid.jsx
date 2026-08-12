export const SkeletonGrid = () => (
  <div className="flex flex-col gap-4">
    {/* Fila 1 — 4 KPI hero */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-surface-base border border-border-base shadow-card overflow-hidden relative">
          <div className="h-full w-full bg-linear-to-r from-surface-muted via-surface-strong/40 to-surface-muted animate-pulse" />
        </div>
      ))}
    </div>

    {/* Fila 2 — 4 KPI secundarios */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-surface-base border border-border-base shadow-card overflow-hidden">
          <div className="h-full w-full bg-linear-to-r from-surface-muted via-surface-strong/40 to-surface-muted animate-pulse" />
        </div>
      ))}
    </div>

    {/* Fila 3 — Actividad + Cobertura */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="h-48 rounded-xl bg-surface-base border border-border-base shadow-card md:col-span-2 overflow-hidden">
        <div className="h-full w-full bg-linear-to-r from-surface-muted via-surface-strong/40 to-surface-muted animate-pulse" />
      </div>
      <div className="h-48 rounded-xl bg-surface-base border border-border-base shadow-card overflow-hidden">
        <div className="h-full w-full bg-linear-to-r from-surface-muted via-surface-strong/40 to-surface-muted animate-pulse" />
      </div>
    </div>

    {/* Fila 4 — Mini-tablas */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-56 rounded-xl bg-surface-base border border-border-base shadow-card overflow-hidden">
          <div className="h-full w-full bg-linear-to-r from-surface-muted via-surface-strong/40 to-surface-muted animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

export default SkeletonGrid;
