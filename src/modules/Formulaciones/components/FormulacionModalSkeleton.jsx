// ─── Skeleton de carga en modo edición ────────────────────────────────────────
export const FormulacionModalSkeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="h-3 w-20 bg-surface-strong rounded" />
        <div className="h-9 bg-surface-muted rounded-xl" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-32 bg-surface-strong rounded" />
        <div className="h-9 bg-surface-muted rounded-xl" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-3 w-40 bg-surface-strong rounded" />
      <div className="h-20 bg-surface-muted rounded-xl" />
    </div>
    <div className="h-3 w-28 bg-surface-strong rounded" />
    <div className="h-10 bg-surface-muted rounded-xl" />
    <div className="space-y-2.5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-border-subtle overflow-hidden">
          <div className="h-10 bg-surface-subtle px-3 flex items-center gap-2">
            <div className="h-5 w-5 bg-surface-strong rounded" />
            <div className="h-3 bg-surface-strong rounded w-40" />
          </div>
          <div className="grid grid-cols-3 divide-x divide-border-subtle">
            <div className="px-3 py-3 space-y-2">
              <div className="h-2.5 bg-surface-muted rounded w-12" />
              <div className="h-7 bg-surface-muted rounded-lg" />
            </div>
            <div className="px-3 py-3 space-y-2">
              <div className="h-2.5 bg-surface-muted rounded w-16" />
              <div className="h-1.5 bg-surface-muted rounded-full" />
              <div className="h-2.5 bg-surface-muted rounded w-24" />
            </div>
            <div className="px-3 py-3 space-y-2">
              <div className="h-2.5 bg-surface-muted rounded w-10" />
              <div className="h-3 bg-surface-muted rounded w-20" />
              <div className="h-5 bg-surface-muted rounded w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default FormulacionModalSkeleton;
