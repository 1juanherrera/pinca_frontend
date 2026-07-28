/**
 * ExportDesprendible — desprendible de pago de nómina por empleado. Dos
 * formatos con los mismos tokens visuales (Outfit, negro/gris, acento
 * amarillo de marca) pero documentos DISTINTOS, no el mismo template con
 * menos filas:
 *   - "Carta"       → DocPdf, A4 completo, detallado con tabla de conceptos.
 *   - "Comprobante" → DocComprobantePago, página chica (media carta), con
 *                     el NETO PAGADO como protagonista — pensado como
 *                     soporte de pago, no como desprendible detallado.
 * Se abre via openDrawer('EXPORT_MODAL_DESPRENDIBLE', { periodo, detalle }).
 */
import { useState, lazy, Suspense } from 'react';
import { X, Download, CheckCircle2, Loader2, FileText, FileMinus } from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import logoFallback from '../../../assets/pincaicono.png';
import { useEmpresaInfo } from '../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../Configuracion/api/useEmpresa';
import { fmt, fmtCant, downloadDocPdf } from '../../../shared/pdf/DocPdf';
import { downloadDocComprobantePago } from './DocComprobantePago';
import { useConfigValue } from '../../Configuracion/api/useConfiguracion';

const DocPdfPreview = lazy(() => import('../../../shared/pdf/DocPdfPreview'));
const DocComprobantePreview = lazy(() => import('./DocComprobantePagoPreview'));

const MEDIO_PAGO_LABEL = {
  efectivo: 'Efectivo', transferencia: 'Transferencia', nequi: 'Nequi',
  daviplata: 'Daviplata', cheque: 'Cheque', otro: 'Otro',
};

const ESTADO_PAGO_LABEL = {
  pagado: 'Pagado', parcial: 'Pago parcial', pendiente: 'Pendiente de pago',
};

const camposBase = (periodo, d) => [
  ['Empleado:', d.empleado_nombre],
  ['Documento:', d.empleado_documento],
  ['Cargo:', d.cargo || '—'],
  ['Período:', periodo.etiqueta],
  ['Tipo:', periodo.tipo === 'quincenal' ? 'Quincenal' : 'Mensual'],
  ['Días trabajados:', fmtCant(d.dias_trabajados)],
  ['Salario base:', fmt(d.salario_base)],
  ['Estado:', ESTADO_PAGO_LABEL[d.estado_pago] || 'Pendiente de pago'],
];

const historialAbonos = (abonos) => {
  if (!abonos.length) return null;
  const lineas = ['Historial de abonos:'];
  abonos.forEach((a) => lineas.push(
    `${a.fecha} — ${fmt(a.monto)} (${MEDIO_PAGO_LABEL[a.medio_pago] || a.medio_pago})${a.observaciones ? ` — ${a.observaciones}` : ''}`,
  ));
  return lineas.join('\n');
};

/** Formato "Carta" — desprendible detallado, con tabla de conceptos. */
const buildConfigCarta = (periodo, d, EMPRESA, logo) => {
  const abonos = d.abonos ?? [];
  const abonado = abonos.reduce((s, a) => s + Number(a.monto), 0);
  const saldo = Number(d.saldo);
  const tieneDescuentos = Number(d.total_descuentos) > 0;

  const filas = [
    { concepto: 'Salario devengado', tipo: 'Devengado', valor: fmt(d.salario_devengado) },
    { concepto: 'Auxilio de transporte', tipo: 'Devengado', valor: fmt(d.auxilio_transporte) },
    { concepto: 'Salud (deducción)', tipo: 'Deducción', valor: `-${fmt(d.deduccion_salud)}` },
    { concepto: 'Pensión (deducción)', tipo: 'Deducción', valor: `-${fmt(d.deduccion_pension)}` },
  ];
  if (tieneDescuentos) {
    filas.push({ concepto: 'Descuentos (mercancía/préstamos)', tipo: 'Descuento', valor: `-${fmt(d.total_descuentos)}` });
  }

  const totales = [
    { label: 'Total devengado', value: fmt(d.total_devengado) },
    { label: 'Total deducciones', value: `-${fmt(d.total_deducciones)}` },
    { label: 'Neto liquidado', value: fmt(d.neto_pagar), grand: true },
  ];
  if (tieneDescuentos) totales.push({ label: 'Descuentos aplicados', value: `-${fmt(d.total_descuentos)}` });
  if (abonado > 0) totales.push({ label: 'Abonado a la fecha', value: `-${fmt(abonado)}` });
  totales.push({ label: saldo <= 0 ? 'SALDO (PAGADO)' : 'SALDO PENDIENTE', value: fmt(saldo), grand: true });

  return {
    titulo: 'DESPRENDIBLE DE PAGO',
    numero: `NOM-${String(periodo.id).padStart(4, '0')}-${String(d.id).padStart(4, '0')}`,
    fecha: abonos.length ? abonos[abonos.length - 1].fecha : periodo.fecha_fin,
    empresa: EMPRESA,
    logo,
    campos: camposBase(periodo, d),
    columnas: [
      { label: 'CONCEPTO', flex: true, desc: true, cell: (r) => r.concepto },
      { label: 'TIPO', w: 90, cell: (r) => r.tipo },
      { label: 'VALOR', w: 110, align: 'right', cell: (r) => r.valor },
    ],
    filas,
    totales,
    observaciones: historialAbonos(abonos),
    firmas: ['Elaborado por (Pinca)', 'Recibí conforme (empleado)'],
  };
};

/**
 * Formato "Comprobante" — documento chico y distinto (DocComprobantePago),
 * orientado al PAGO: el neto a pagar es lo primero que se ve, el desglose es
 * un resumen de 2-3 líneas por sección (no una tabla), y el saldo pendiente
 * queda destacado aparte SOLO si aporta información nueva (si coincide
 * exactamente con el neto — nada abonado aún — se omite por redundante).
 */
const buildConfigComprobante = (periodo, d, EMPRESA, logo, pctSalud, pctPension) => {
  const abonos = d.abonos ?? [];
  const saldoNum = Number(d.saldo);
  const netoAPagar = Number(d.neto_pagar) - Number(d.total_descuentos);
  const tieneDescuentos = Number(d.total_descuentos) > 0;

  return {
    numero: `NOM-${String(periodo.id).padStart(4, '0')}-${String(d.id).padStart(4, '0')}`,
    fecha: abonos.length ? abonos[abonos.length - 1].fecha : periodo.fecha_fin,
    empresa: EMPRESA,
    logo,
    empleado: {
      nombre: d.empleado_nombre,
      documento: d.empleado_documento,
      cargo: d.cargo,
      salarioBase: fmt(d.salario_base),
    },
    periodo: {
      etiqueta: periodo.etiqueta,
      dias: fmtCant(d.dias_trabajados),
      estado: ESTADO_PAGO_LABEL[d.estado_pago] || 'Pendiente de pago',
    },
    devengos: {
      salario: fmt(d.salario_devengado),
      auxilio: fmt(d.auxilio_transporte),
      total: fmt(d.total_devengado),
    },
    deducciones: {
      salud: fmt(d.deduccion_salud),
      pension: fmt(d.deduccion_pension),
      pctSalud,
      pctPension,
      descuentos: tieneDescuentos ? fmt(d.total_descuentos) : null,
      total: fmt(d.total_deducciones),
    },
    neto: fmt(netoAPagar),
    // pagado decide la etiqueta del recuadro grande (independiente de si la
    // caja de saldo se muestra o no). saldo=null cuando coincide EXACTO con
    // el neto (nada abonado aún) — mostrarlo repetiría el mismo número de
    // arriba; en cualquier otro caso (abono parcial o ya saldado) sí aporta.
    pagado: saldoNum <= 0,
    saldo: saldoNum === netoAPagar ? null : { pendiente: saldoNum > 0, value: fmt(saldoNum) },
  };
};

const ExportDesprendibleContent = ({ periodo, detalle, closeModal }) => {
  const EMPRESA = useEmpresaInfo();
  const { data: logoB64Data } = useEmpresaLogoBase64();
  const previewLogo = logoB64Data?.logo || logoFallback;
  const [isExporting, setIsExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [formato, setFormato] = useState('carta');
  const esComprobante = formato === 'comprobante';
  const pctSalud = useConfigValue('nomina_pct_salud', 4);
  const pctPension = useConfigValue('nomina_pct_pension', 4);

  const config = esComprobante
    ? buildConfigComprobante(periodo, detalle, EMPRESA, previewLogo, pctSalud, pctPension)
    : buildConfigCarta(periodo, detalle, EMPRESA, previewLogo);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      if (esComprobante) await downloadDocComprobantePago(config, `comprobante_${config.numero}`);
      else await downloadDocPdf(config, `desprendible_${config.numero}`);
      setDone(true);
      setTimeout(() => { setDone(false); closeModal(); }, 1200);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110]" onClick={closeModal} />
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        <div className="w-full max-w-4xl h-[88vh] bg-surface-elevated rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-content-primary rounded-xl flex items-center justify-center">
                <FileText size={16} className="text-content-inverse" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-content-primary">Vista previa — {config.numero}</h2>
                <p className="text-xs text-content-muted">{detalle.empleado_nombre}</p>
              </div>
            </div>
            <button onClick={closeModal} className="p-1.5 text-content-muted hover:text-content-secondary hover:bg-surface-muted rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col bg-surface-muted">
            <Suspense fallback={<div className="flex-1 flex items-center justify-center gap-3 text-content-muted"><Loader2 size={20} className="animate-spin" /><span className="text-sm font-medium">Generando vista previa…</span></div>}>
              {esComprobante ? <DocComprobantePreview {...config} /> : <DocPdfPreview {...config} formato="carta" />}
            </Suspense>
          </div>

          <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle flex flex-wrap items-center justify-between gap-3 shrink-0">
            <p className="text-xs text-content-muted shrink-0">Saldo pendiente: <span className="font-semibold text-content-secondary">{fmt(detalle.saldo)}</span></p>

            <div className="flex items-center gap-0.5 bg-surface-strong/60 rounded-lg p-0.5 shrink-0">
              <button
                onClick={() => setFormato('carta')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${formato === 'carta' ? 'bg-surface-elevated text-content-primary shadow-sm' : 'text-content-tertiary hover:text-content-secondary'}`}
              >
                <FileText size={12} /> Carta
              </button>
              <button
                onClick={() => setFormato('comprobante')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${formato === 'comprobante' ? 'bg-surface-elevated text-content-primary shadow-sm' : 'text-content-tertiary hover:text-content-secondary'}`}
              >
                <FileMinus size={12} /> Comprobante
              </button>
            </div>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 shrink-0
                ${done ? 'bg-semantic-success text-white' : 'bg-brand-primary text-content-on-brand hover:bg-brand-primary-hover disabled:opacity-50 disabled:pointer-events-none'}`}
            >
              {done ? <><CheckCircle2 size={16} /> Descargado</>
                : isExporting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generando...</>
                : <><Download size={16} /> Descargar PDF</>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const ExportDesprendible = () => {
  const activeDrawer = useBoundStore((s) => s.activeDrawer);
  const payload = useBoundStore((s) => s.drawerPayload);
  const closeDrawer = useBoundStore((s) => s.closeDrawer);
  if (activeDrawer !== 'EXPORT_MODAL_DESPRENDIBLE' || !payload?.detalle) return null;
  return (
    <ExportDesprendibleContent
      key={payload.detalle.id}
      periodo={payload.periodo}
      detalle={payload.detalle}
      closeModal={closeDrawer}
    />
  );
};

export default ExportDesprendible;
