import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { EMPRESA_FALLBACK } from '../../../../utils/empresaInfo';
import '../../../../shared/pdf/fonts';

/**
 * EJEMPLO — mismo layout estructural que `Cotizaciones/CotizacionFactusStyleDoc.jsx`
 * (inspirado en Factus), adaptado a una remisión: sin descuento/IVA por línea
 * (la remisión de PINCA no aplica impuesto, ver ExportRemision.jsx original —
 * subtotal = total), panel con dirección de entrega + estado en vez de
 * fechas de vencimiento.
 *
 * Standalone — no toca `shared/pdf/DocPdf.jsx` ni `ExportRemision.jsx` original.
 */
const INK = '#1a1a1a';
const MUTED = '#555555';
const FAINT = '#888888';
const BORDER = '#cccccc';
const HEAD_BG = '#f2f2f2';

const s = StyleSheet.create({
  page: { fontFamily: 'Outfit', fontSize: 8, color: INK, backgroundColor: '#fff', padding: 28, lineHeight: 1.35 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headLeft: { width: 150, alignItems: 'flex-start' },
  logo: { width: 100, height: 100, objectFit: 'contain', objectPositionX: 0 },

  headRight: { flex: 1, alignItems: 'flex-end', paddingLeft: 10 },
  docTitle: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 13, textAlign: 'right', lineHeight: 1.3, marginBottom: 2 },
  docNumero: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 9, textAlign: 'right', lineHeight: 1.3, marginTop: 2, marginBottom: 8, color: MUTED },
  legalBox: { borderWidth: 1, borderColor: BORDER, backgroundColor: HEAD_BG, paddingVertical: 8, paddingHorizontal: 10, width: '100%' },
  legalLine: { fontSize: 7.5, color: MUTED, textAlign: 'right', lineHeight: 1.5 },
  legalLineBold: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 8, color: INK, textAlign: 'right', lineHeight: 1.5 },

  hr: { borderBottomWidth: 1, borderBottomColor: INK, marginTop: 10, marginBottom: 8 },

  panel: { flexDirection: 'row', borderWidth: 1, borderColor: BORDER, marginBottom: 10 },
  panelCol: { flex: 1, padding: 6 },
  panelColBorder: { borderRightWidth: 1, borderRightColor: BORDER },
  panelRow: { flexDirection: 'row', marginBottom: 2 },
  panelLabel: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 7, width: 62, color: INK },
  panelValue: { fontSize: 7.5, color: INK, flex: 1 },

  table: { borderWidth: 1, borderColor: BORDER, marginBottom: 8 },
  thead: { flexDirection: 'row', backgroundColor: HEAD_BG, borderBottomWidth: 1, borderBottomColor: BORDER },
  th: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 7, padding: 4, borderRightWidth: 1, borderRightColor: BORDER },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER },
  td: { fontSize: 7.5, padding: 4, borderRightWidth: 1, borderRightColor: BORDER },

  colNum: { width: 20 },
  colCod: { width: 55 },
  colDesc: { flex: 1 },
  colNum2: { width: 65, textAlign: 'right' },
  colQty: { width: 55, textAlign: 'right' },
  colTot: { width: 75, textAlign: 'right', borderRightWidth: 0 },

  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  obsBlock: { width: 260 },
  obsHead: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 7.5, marginBottom: 3 },
  obsTxt: { fontSize: 7.5, color: MUTED, lineHeight: 1.5 },

  totalsBox: { width: 210, borderWidth: 1, borderColor: BORDER },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  totalsRowLast: { borderBottomWidth: 0, backgroundColor: HEAD_BG },
  totalsLabel: { fontSize: 7.5 },
  totalsLabelGrand: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 8.5 },
  totalsVal: { fontSize: 7.5 },
  totalsValGrand: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 8.5 },

  signRow: { flexDirection: 'row', marginTop: 26 },
  signCol: { flex: 1, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 5 },
  signGap: { width: 40 },
  signLabel: { fontSize: 7.5, color: MUTED },

  finePrint: { marginTop: 20, textAlign: 'center', fontSize: 6.5, color: FAINT },
});

const money = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;
const cant = (n) => new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(Number(n) || 0);

/**
 * @param numero         Número de remisión (ej. 'REM-2026-0001')
 * @param fecha          Fecha de la remisión
 * @param estado         'Pendiente' | 'Facturada' | 'Anulada'
 * @param empresa        Shape de useEmpresaInfo()
 * @param logo           Logo base64/URL
 * @param cliente        { nombre, documento, ciudad, direccionEntrega }
 * @param items          [{ codigo, descripcion, valorUnit, cantidad }]
 * @param observaciones  string opcional
 */
export const RemisionFactusStyleDoc = ({
  numero, fecha, estado, empresa: E = EMPRESA_FALLBACK, logo,
  cliente = {}, items = [], observaciones,
}) => {
  const filas = items.map((it) => ({
    ...it,
    total: Number(it.valorUnit || 0) * Number(it.cantidad || 0),
  }));
  const total = filas.reduce((a, f) => a + f.total, 0);

  return (
    <Document title={`Remisión ${numero || ''}`.trim()} author={E.nombre}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.headLeft}>
            {logo ? <Image src={logo} style={s.logo} /> : null}
          </View>
          <View style={s.headRight}>
            <Text style={s.docTitle}>REMISIÓN DE ENTREGA</Text>
            <Text style={s.docNumero}>NÚMERO {numero ?? '—'}</Text>
            <View style={s.legalBox}>
              <Text style={s.legalLineBold}>{E.nombre}</Text>
              <Text style={s.legalLine}>{E.nit}</Text>
              <Text style={s.legalLine}>{E.telefono}  ·  {E.email}</Text>
              <Text style={s.legalLine}>{E.direccion}  ·  {E.ciudad}</Text>
            </View>
          </View>
        </View>
        <View style={s.hr} />

        <View style={s.panel}>
          <View style={[s.panelCol, s.panelColBorder]}>
            <View style={s.panelRow}><Text style={s.panelLabel}>Cliente:</Text><Text style={s.panelValue}>{cliente.nombre ?? '—'}</Text></View>
            <View style={s.panelRow}><Text style={s.panelLabel}>NIT/CC:</Text><Text style={s.panelValue}>{cliente.documento ?? '—'}</Text></View>
            <View style={s.panelRow}><Text style={s.panelLabel}>Ciudad:</Text><Text style={s.panelValue}>{cliente.ciudad ?? '—'}</Text></View>
            <View style={s.panelRow}><Text style={s.panelLabel}>Entrega en:</Text><Text style={s.panelValue}>{cliente.direccionEntrega ?? '—'}</Text></View>
          </View>
          <View style={s.panelCol}>
            <View style={s.panelRow}><Text style={s.panelLabel}>Fecha:</Text><Text style={s.panelValue}>{fecha ?? '—'}</Text></View>
            <View style={s.panelRow}><Text style={s.panelLabel}>Estado:</Text><Text style={s.panelValue}>{estado ?? '—'}</Text></View>
          </View>
        </View>

        <View style={s.table}>
          <View style={s.thead}>
            <Text style={[s.th, s.colNum]}>#</Text>
            <Text style={[s.th, s.colCod]}>Código</Text>
            <Text style={[s.th, s.colDesc]}>Descripción</Text>
            <Text style={[s.th, s.colNum2]}>Val. Unit</Text>
            <Text style={[s.th, s.colQty]}>Cantidad</Text>
            <Text style={[s.th, s.colTot]}>Val. Item</Text>
          </View>
          {filas.map((f, i) => (
            <View key={i} style={s.tr} wrap={false}>
              <Text style={[s.td, s.colNum]}>{i + 1}</Text>
              <Text style={[s.td, s.colCod]}>{f.codigo}</Text>
              <Text style={[s.td, s.colDesc]}>{f.descripcion}</Text>
              <Text style={[s.td, s.colNum2]}>{money(f.valorUnit)}</Text>
              <Text style={[s.td, s.colQty]}>{cant(f.cantidad)}</Text>
              <Text style={[s.td, s.colTot]}>{money(f.total)}</Text>
            </View>
          ))}
        </View>

        <View style={s.bottomRow}>
          <View style={s.obsBlock}>
            {observaciones ? (
              <>
                <Text style={s.obsHead}>Observaciones</Text>
                <Text style={s.obsTxt}>{observaciones}</Text>
              </>
            ) : null}
          </View>
          <View style={s.totalsBox}>
            <View style={[s.totalsRow, s.totalsRowLast]}>
              <Text style={s.totalsLabelGrand}>Total</Text>
              <Text style={s.totalsValGrand}>{money(total)}</Text>
            </View>
          </View>
        </View>

        <View style={s.signRow}>
          <View style={s.signCol}><Text style={s.signLabel}>Despachado por</Text></View>
          <View style={s.signGap} />
          <View style={s.signCol}><Text style={s.signLabel}>Recibido conforme</Text></View>
        </View>

        <Text style={s.finePrint}>Remisión generada por el sistema ERP de {E.nombre}. No constituye una factura de venta.</Text>
      </Page>
    </Document>
  );
};

export async function downloadRemisionFactusStyle(config, filename) {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<RemisionFactusStyleDoc {...config} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || config.numero || 'remision'}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default RemisionFactusStyleDoc;
