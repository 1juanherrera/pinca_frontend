// ─── Sección de info ──────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b border-border-subtle last:border-0">
    <div className="flex items-center gap-2 text-content-muted">
      <Icon size={12} />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </div>
    <span className="text-xs font-semibold text-content-secondary text-right">{value ?? '—'}</span>
  </div>
);

export default InfoRow;
