import { PDFViewer } from '@react-pdf/renderer';
import { DocPdf } from './DocPdf';
import { DocTicket } from './DocTicket';

/**
 * Preview WYSIWYG compartido: muestra el MISMO documento que se descarga.
 * Según config.formato renderiza la carta A4 (DocPdf) o la tirilla POS (DocTicket).
 * Se carga de forma diferida (React.lazy) porque @react-pdf/renderer es pesado.
 */
export default function DocPdfPreview({ formato, ...config }) {
  const Doc = formato === 'tiquete' ? DocTicket : DocPdf;
  return (
    <PDFViewer showToolbar={false} style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}>
      <Doc {...config} />
    </PDFViewer>
  );
}
