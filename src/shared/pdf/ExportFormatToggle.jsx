// Pill de formatos (Carta/Tiquete, Carta/Tiquete/Factus, Carta/Comprobante,
// Con precios/Sin precios, etc.) — mismo template de botón repetido en los
// footers de los exportadores PDF.
export const ExportFormatToggle = ({ options, value, onChange }) => (
  <div className="flex items-center gap-0.5 bg-surface-strong/60 rounded-lg p-0.5 shrink-0">
    {options.map(({ value: v, label, icon: Icon }) => (
      <button
        key={v}
        onClick={() => onChange(v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${value === v ? 'bg-surface-elevated text-content-primary shadow-sm' : 'text-content-tertiary hover:text-content-secondary'}`}
      >
        <Icon size={12} /> {label}
      </button>
    ))}
  </div>
);

export default ExportFormatToggle;
