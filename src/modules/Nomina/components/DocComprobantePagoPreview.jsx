import { PDFViewer } from '@react-pdf/renderer';
import { DocComprobantePago } from './DocComprobantePago';

/** Preview WYSIWYG del comprobante breve — mismo componente que se descarga. */
export default function DocComprobantePagoPreview(config) {
  return (
    <PDFViewer showToolbar={false} style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}>
      <DocComprobantePago {...config} />
    </PDFViewer>
  );
}
