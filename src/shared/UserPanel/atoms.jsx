// ─── Componentes reutilizables ────────────────────────────────────────────────
export const Toggle = ({ checked, onChange, disabled }) => (
  <button type="button" disabled={disabled} onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
      disabled ? 'opacity-40 cursor-not-allowed bg-surface-strong'
      : checked  ? 'bg-semantic-success cursor-pointer'
                 : 'bg-surface-strong cursor-pointer'
    }`}
  >
    <span className={`inline-block h-3.5 w-3.5 rounded-full bg-surface-base shadow transition-transform ${
      checked ? 'translate-x-4.5' : 'translate-x-0.75'
    }`} />
  </button>
);

export const SectionTitle = ({ icon: Icon, children }) => (
  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-content-muted uppercase tracking-wider mb-2">
    <Icon size={11} />{children}
  </p>
);
