export const EMPTY_ITEM = { descripcion: '', cantidad: 1, precio_unitario: 0 };

export const buildInitialForm = (data) => ({
  cliente_id:        data?.cliente_id        ?? '',
  fecha_emision:     data?.fecha_emision     ?? '',
  fecha_vencimiento: data?.fecha_vencimiento ?? '',
  descuento:         data?.descuento         ?? 0,
  impuestos:         data?.impuestos         ?? 0,
  retencion:         data?.retencion         ?? 0,
  observaciones:     data?.observaciones     ?? '',
});

export const fmtCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
