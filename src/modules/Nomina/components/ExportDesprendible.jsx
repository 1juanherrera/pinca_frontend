/**
 * ExportDesprendible — desprendible de pago de nómina por empleado, con la
 * plantilla compartida DocPdf. Se abre via
 * openDrawer('EXPORT_MODAL_DESPRENDIBLE', { periodo, detalle }).
 */
import { useState, lazy, Suspense } from 'react';
import { X, Download, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import logoFallback from '../../../assets/pincaicono.png';
import { useEmpresaInfo } from '../../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../../Configuracion/api/useEmpresa';
import { fmt, fmtCant, downloadDocPdf } from '../../../shared/pdf/DocPdf';

const DocPdfPreview = lazy(() => import('../../../shared/pdf/DocPdfPreview'));

const MEDIO_PAGO_LABEL = {
  efectivo: 'Efectivo', transferencia: 'Transferencia', nequi: 'Nequi',
  daviplata: 'Daviplata', cheque: 'Cheque', otro: 'Otro',
};

const ESTADO_PAGO_LABEL = {
  pagado: 'Pagado', parcial: 'Pago parcial', pendiente: 'Pendiente de pago',
};

const buildConfig = (periodo, d, EMPRESA, logo) => {
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

  const obsLineas = [];
  if (abonos.length) {
    obsLineas.push('Historial de abonos:');
    abonos.forEach((a) => obsLineas.push(
      `${a.fecha} — ${fmt(a.monto)} (${MEDIO_PAGO_LABEL[a.medio_pago] || a.medio_pago})${a.observaciones ? ` — ${a.observaciones}` : ''}`,
    ));
  }

  return {
    titulo: 'DESPRENDIBLE DE PAGO',
    numero: `NOM-${String(periodo.id).padStart(4, '0')}-${String(d.id).padStart(4, '0')}`,
    fecha: abonos.length ? abonos[abonos.length - 1].fecha : periodo.fecha_fin,
    empresa: EMPRESA,
    logo,
    campos: [
      ['Empleado:', d.empleado_nombre],
      ['Documento:', d.empleado_documento],
      ['Cargo:', d.cargo || '—'],
      ['Período:', periodo.etiqueta],
      ['Tipo:', periodo.tipo === 'quincenal' ? 'Quincenal' : 'Mensual'],
      ['Días trabajados:', fmtCant(d.dias_trabajados)],
      ['Salario base:', fmt(d.salario_base)],
      ['Estado:', ESTADO_PAGO_LABEL[d.estado_pago] || 'Pendiente de pago'],
    ],
    columnas: [
      { label: 'CONCEPTO', flex: true, desc: true, cell: (r) => r.concepto },
      { label: 'TIPO', w: 90, cell: (r) => r.tipo },
      { label: 'VALOR', w: 110, align: 'right', cell: (r) => r.valor },
    ],
    filas,
    totales,
    observaciones: obsLineas.length ? obsLineas.join('\n') : null,
    firmas: ['Elaborado por (Pinca)', 'Recibí conforme (empleado)'],
  };
};

const ExportDesprendibleContent = ({ periodo, detalle, closeModal }) => {
  const EMPRESA = useEmpresaInfo();
  const { data: logoB64Data } = useEmpresaLogoBase64();
  const previewLogo = logoB64Data?.logo || logoFallback;
  const [isExporting, setIsExporting] = useState(false);
  const [done, setDone] = useState(false);

  const config = buildConfig(periodo, detalle, EMPRESA, previewLogo);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      await downloadDocPdf(config, `desprendible_${config.numero}`);
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
              <DocPdfPreview {...config} />
            </Suspense>
          </div>

          <div className="px-5 py-4 border-t border-border-subtle bg-surface-subtle flex flex-wrap items-center justify-between gap-3 shrink-0">
            <p className="text-xs text-content-muted shrink-0">Saldo pendiente: <span className="font-semibold text-content-secondary">{fmt(detalle.saldo)}</span></p>

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
