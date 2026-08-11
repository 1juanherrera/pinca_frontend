// ── Mini-stat ────────────────────────────────────────────────────────────────
const Stat = ({ icon: Icon, label, value, tone = 'neutral' }) => {
  const tones = {
    neutral: 'bg-surface-subtle border-border-base text-content-primary',
    info:    'bg-semantic-info-subtle/40 border-semantic-info/20 text-semantic-info-fg',
    warning: 'bg-semantic-warning-subtle/40 border-semantic-warning/20 text-semantic-warning-fg',
    success: 'bg-semantic-success-subtle/40 border-semantic-success/20 text-semantic-success-fg',
  }[tone];
  return (
    <div className={`px-4 py-3 border rounded-xl ${tones}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={11} className="opacity-70" />
        <p className="text-[10px] uppercase tracking-widest font-bold opacity-70">{label}</p>
      </div>
      <p className="text-base font-bold tabular-nums">{value}</p>
    </div>
  );
};

export default Stat;
