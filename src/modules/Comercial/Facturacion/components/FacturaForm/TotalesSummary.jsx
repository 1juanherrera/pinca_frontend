import { fmtCOP } from './helpers';

export const TotalesSummary = ({ form, subtotal, impuestos, ivaActivo, ivaPct, total }) => (
  <div className="bg-surface-subtle border border-border-base rounded-md p-4 space-y-1.5 text-xs">
    <div className="flex justify-between text-content-tertiary">
      <span>Subtotal</span>
      <span className="tabular-nums">{fmtCOP(subtotal)}</span>
    </div>
    <div className="flex justify-between text-content-tertiary">
      <span>Descuento</span>
      <span className="text-semantic-danger-fg tabular-nums">- {fmtCOP(form.descuento)}</span>
    </div>
    <div className="flex justify-between text-content-tertiary">
      <span>IVA{ivaActivo ? ` (${ivaPct}%)` : ' / Impuestos'}</span>
      <span className="tabular-nums">{fmtCOP(impuestos)}</span>
    </div>
    <div className="flex justify-between text-content-tertiary">
      <span>Retención</span>
      <span className="text-semantic-danger-fg tabular-nums">- {fmtCOP(form.retencion)}</span>
    </div>
    <div className="border-t border-border-base pt-1.5 flex justify-between font-semibold text-content-primary">
      <span>Total</span>
      <span className="text-base tabular-nums">{fmtCOP(total)}</span>
    </div>
  </div>
);

export default TotalesSummary;
