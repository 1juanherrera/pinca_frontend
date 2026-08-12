export const SectionTitle = ({ icon: Icon, children, action }) => (
  <div className="flex items-center justify-between gap-3 mb-3">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={14} className="text-content-muted" />}
      <h2 className="text-sm font-semibold text-content-primary">{children}</h2>
    </div>
    {action}
  </div>
);

export const Card = ({ children, className = '' }) => (
  <div className={`bg-surface-base border border-border-base rounded-xl shadow-card ${className}`}>
    {children}
  </div>
);
