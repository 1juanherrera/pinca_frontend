export const TIPO_LABEL = {
  factura:      'Factura de venta',
  cotizacion:   'Cotización',
  remision:     'Remisión',
  orden_compra: 'Orden de compra',
  nota_credito: 'Nota crédito',
};

export const computeEstado = (s) => {
  const hoy = new Date().toISOString().slice(0, 10);
  if (s.fecha_vigencia_hasta && s.fecha_vigencia_hasta < hoy) {
    return { tone: 'danger',  label: 'Vencida' };
  }
  if (s.rango_max != null && s.folios_restantes !== null) {
    if (s.folios_restantes === 0)        return { tone: 'danger',  label: 'Agotada' };
    if (s.folios_restantes <= 50)        return { tone: 'warning', label: 'Por vencer' };
  }
  return { tone: 'success', label: 'Vigente' };
};

export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO') : '—';
