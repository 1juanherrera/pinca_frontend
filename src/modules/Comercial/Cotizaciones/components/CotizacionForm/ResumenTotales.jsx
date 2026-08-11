import { fmtCOP } from './helpers';

// ─── Resumen de totales ────────────────────────────────────────────────────────
const ResumenTotales = ({ subtotal, form, ivaActivo, ivaPct, impuestos, total }) => (
  <div className="bg-surface-subtle border border-border-base rounded-lg p-3 space-y-1 text-xs">
    {[
      ['Subtotal',  fmtCOP(subtotal),             'text-content-secondary'],
      ['Descuento', `- ${fmtCOP(form.descuento)}`, 'text-semantic-danger-fg' ],
      [`IVA${ivaActivo ? ` (${ivaPct}%)` : ''}`, fmtCOP(impuestos), 'text-content-secondary'],
      ['Retención', `- ${fmtCOP(form.retencion)}`, 'text-semantic-danger-fg' ],
    ].map(([label, val, cls]) => (
      <div key={label} className="flex justify-between text-content-tertiary">
        <span>{label}</span>
        <span className={` ${cls}`}>{val}</span>
      </div>
    ))}
    <div className="border-t border-border-strong pt-1.5 flex justify-between font-bold text-content-primary">
      <span>Total</span>
      <span className="">{fmtCOP(total)}</span>
    </div>
  </div>
);

export default ResumenTotales;
