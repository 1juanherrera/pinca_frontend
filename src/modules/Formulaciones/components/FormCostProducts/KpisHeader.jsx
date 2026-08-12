export const KpisHeader = ({ costos }) => (
  <div className="grid grid-cols-2 gap-3 px-6 py-4 border-b border-border-subtle bg-surface-subtle/50">
    <div className="bg-surface-base border border-border-base rounded-xl px-4 py-3 shadow-sm">
      <p className="text-[9px] font-bold text-content-muted uppercase tracking-widest mb-1">
        Total Materia Prima
      </p>
      <p className="text-sm font-semibold text-content-primary ">
        $ {costos?.total_costo_materia_prima ?? '—'}
      </p>
    </div>
    <div className="bg-semantic-success-subtle border border-semantic-success/15 rounded-xl px-4 py-3 shadow-sm">
      <p className="text-[9px] font-bold text-semantic-success uppercase tracking-widest mb-1">
        Precio de Venta Actual
      </p>
      <p className="text-sm font-semibold text-semantic-success-fg">
        $ {costos?.precio_venta ?? '—'}
      </p>
    </div>
  </div>
);

export default KpisHeader;
