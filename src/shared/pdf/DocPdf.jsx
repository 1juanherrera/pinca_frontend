import { Document, Page, View, Text, Image, StyleSheet, Font } from '@react-pdf/renderer';
import { EMPRESA_FALLBACK } from '../../utils/empresaInfo';
import OutfitRegular from '../../assets/fonts/Outfit-Regular.ttf';
import OutfitBold from '../../assets/fonts/Outfit-Bold.ttf';

// Tipografía de marca (Outfit). Registro una sola vez.
Font.register({
  family: 'Outfit',
  fonts: [
    { src: OutfitRegular, fontWeight: 400 },
    { src: OutfitBold, fontWeight: 700 },
  ],
});

/**
 * Plantilla PDF compartida branded PINCA. Fuente de verdad única para el
 * preview (<PDFViewer>) y la descarga (pdf().toBlob()) de TODOS los documentos.
 * Cada documento (Remisión, Factura, Cotización, OC, Recibo, Nota Crédito)
 * la usa pasando su propia config (título, campos, columnas, totales…).
 */
export const fmt = (n) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0);
export const fmtCant = (n) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(Number(n) || 0);
const cleanWeb = (w) => String(w ?? '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/+$/, '');
const stripTel = (t) => String(t ?? '').replace(/^\s*tel[:.]?\s*/i, '');
const stripNit = (n) => String(n ?? '').replace(/^\s*nit[:.]?\s*/i, '');

const INK = '#1a1a1a', MUTED = '#666666', HAIR = '#e5e5e5';
const BRAND = '#FBBF24', DARK = '#1a1a1a', ZEBRA = '#f6f6f6';

const s = StyleSheet.create({
  page: { fontFamily: 'Outfit', fontSize: 9, color: INK, backgroundColor: '#fff', paddingTop: 34, paddingHorizontal: 40, paddingBottom: 62, lineHeight: 1.4 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headLeft: { flex: 1, paddingRight: 16 },
  logo: { width: 148, height: 72, objectFit: 'contain', objectPositionX: 0, alignSelf: 'flex-start', marginBottom: 5 },
  coName: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 12.5, color: INK },
  infoCard: { marginTop: 6, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 5, paddingVertical: 8, paddingHorizontal: 13, flexDirection: 'row' },
  infoCol: { flex: 1, paddingRight: 10 },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  cardLabel: { fontSize: 6, fontFamily: 'Outfit', fontWeight: 700, letterSpacing: 0.4, color: '#999999', width: 30 },
  cardVal: { fontSize: 7.5, color: '#333333', flex: 1 },
  headRight: { alignItems: 'flex-end', width: 195, paddingTop: 4 },
  docLabel: { fontSize: 8, fontFamily: 'Outfit', fontWeight: 700, letterSpacing: 1.5, color: MUTED, textAlign: 'right' },
  docNum: { fontSize: 22, fontFamily: 'Outfit', fontWeight: 700, color: INK, marginTop: 4, lineHeight: 1, textAlign: 'right' },
  dateChip: { backgroundColor: DARK, borderRadius: 20, paddingVertical: 3, paddingHorizontal: 12, marginTop: 8 },
  dateChipTxt: { fontSize: 8, fontFamily: 'Outfit', fontWeight: 700, color: '#ffffff' },

  accent: { height: 1, backgroundColor: '#cccccc', marginTop: 10 },

  // Grid compacto de campos (cliente/empleado/período/etc.) — 3 por fila,
  // label chico arriba + valor abajo, mismo lenguaje visual que infoCard.
  fields: { marginTop: 10, borderWidth: 1, borderColor: HAIR, borderRadius: 5, paddingVertical: 7, paddingHorizontal: 12, flexDirection: 'row', flexWrap: 'wrap' },
  fItem: { width: '33.33%', marginBottom: 5 },
  fItemInner: { paddingRight: 10 },
  fItemLabel: { fontSize: 6.5, fontFamily: 'Outfit', fontWeight: 700, letterSpacing: 0.4, color: '#999999', marginBottom: 2 },
  fItemValue: { fontSize: 8.5, fontFamily: 'Outfit', fontWeight: 700, color: INK },

  table: { marginTop: 14 },
  thead: { flexDirection: 'row', backgroundColor: DARK, paddingVertical: 7, paddingHorizontal: 10 },
  th: { color: '#fff', fontSize: 8, fontFamily: 'Outfit', fontWeight: 700, letterSpacing: 0.4 },
  tr: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: HAIR },
  trAlt: { backgroundColor: ZEBRA },
  td: { fontSize: 8.5, color: INK },
  tdBold: { fontFamily: 'Outfit', fontWeight: 700, color: INK },
  emptyRow: { paddingVertical: 16, textAlign: 'center', color: MUTED, fontSize: 8.5, flex: 1 },

  totalWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  totalBox: { minWidth: 250, borderWidth: 1, borderColor: HAIR },
  totRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 14 },
  totLabel: { fontSize: 9, color: INK },
  totVal: { fontSize: 9, color: INK },
  totRowGrand: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, paddingHorizontal: 14, backgroundColor: ZEBRA, borderLeftWidth: 4, borderLeftColor: DARK },
  totLabelGrand: { fontSize: 11, fontFamily: 'Outfit', fontWeight: 700, color: INK },
  totValGrand: { fontSize: 12, fontFamily: 'Outfit', fontWeight: 700, color: INK },

  // ── Monto destacado (recibo / nota crédito) ──
  montoBox: { marginTop: 18, borderWidth: 1.5, borderColor: DARK, borderRadius: 6, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' },
  montoLabel: { fontSize: 8, fontFamily: 'Outfit', fontWeight: 700, letterSpacing: 1, color: MUTED },
  montoVal: { fontSize: 26, fontFamily: 'Outfit', fontWeight: 700, color: INK, marginTop: 5, lineHeight: 1 },
  montoSub: { fontSize: 8, color: MUTED, marginTop: 5, letterSpacing: 0.5 },

  obsWrap: { marginTop: 14 },
  obsHead: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 8.5, marginBottom: 3 },
  obsTxt: { fontSize: 8.5, color: INK, lineHeight: 1.5 },
  // NUNCA marginTop:'auto' acá — con contenido variable, @react-pdf/renderer
  // calcula mal el "stretch to bottom" al paginar: si el resto no entra
  // completo en la página 1, crea una página 2 casi en blanco e intenta
  // volver a estirar el sobrante hasta el fondo de ESA página también.
  signRow: { flexDirection: 'row', marginTop: 20, paddingTop: 16 },
  signCol: { flex: 1, borderTopWidth: 1, borderTopColor: HAIR, paddingTop: 5 },
  signGap: { width: 40 },
  signLabel: { fontSize: 8, color: MUTED },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: DARK, paddingVertical: 6, paddingHorizontal: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footLeft: { flexDirection: 'row', alignItems: 'center' },
  footRight: { alignItems: 'flex-end' },
  footLogo: { width: 44, height: 30, objectFit: 'contain', objectPositionX: 0, marginRight: 8 },
  footTxt: { fontSize: 8, color: '#e5e5e5', lineHeight: 1.35 },
  footBold: { fontFamily: 'Outfit', fontWeight: 700 },
  footAccent: { color: BRAND },

  watermark: { position: 'absolute', top: 320, left: 60, right: 60, textAlign: 'center', fontSize: 90, fontFamily: 'Outfit', fontWeight: 700, color: '#f0f0f0', transform: 'rotate(-24deg)' },
});

const InfoRow = ({ label, value }) => (
  <View style={s.cardRow}>
    <Text style={s.cardLabel}>{label}</Text>
    <Text style={s.cardVal}>{value}</Text>
  </View>
);

const colStyle = (c) => [
  c.flex ? { flex: 1 } : { width: c.w },
  { textAlign: c.align || 'left' },
  c.desc ? { paddingLeft: 18, paddingRight: 6 } : null,
  !c.flex && c.align === 'right' ? { paddingRight: 6 } : null,
];

/**
 * @param titulo   Rótulo del documento (ej. 'FACTURA DE VENTA')
 * @param numero   Número visible
 * @param fecha    Fecha (chip)
 * @param empresa  Datos de empresa (useEmpresaInfo)
 * @param logo     Logo base64/URL
 * @param campos   [[label, value], ...] — se muestran 2 por fila
 * @param columnas [{ label, w|flex, align, desc?, bold?, cell:(item,i)=>value }]
 * @param filas    Array de ítems
 * @param totales  [{ label, value, grand? }]
 * @param observaciones  string opcional
 * @param firmas   [izq, der] o null
 * @param watermark  string opcional (ej. 'ANULADA')
 * @param docTitle metadata del PDF
 */
export const DocPdf = ({
  titulo, numero, fecha, empresa: E = EMPRESA_FALLBACK, logo,
  campos = [], columnas = [], filas = [], totales = [], monto = null,
  observaciones, obsLabel = 'Observaciones', firmas = null, watermark = null, docTitle,
}) => {
  return (
    <Document title={docTitle || `${titulo} ${numero || ''}`.trim()} author={E.nombre}>
      <Page size="A4" style={s.page}>
        {watermark ? <Text style={s.watermark} fixed>{watermark}</Text> : null}

        {/* Encabezado */}
        <View style={s.header}>
          <View style={s.headLeft}>
            {logo ? <Image src={logo} style={s.logo} /> : null}
            <Text style={s.coName}>{E.nombre}</Text>
            <View style={s.infoCard}>
              <View style={s.infoCol}>
                <InfoRow label="NIT" value={stripNit(E.nit)} />
                <InfoRow label="DIR" value={E.direccion} />
                <InfoRow label="CIUDAD" value={E.ciudad} />
              </View>
              <View style={{ flex: 1 }}>
                <InfoRow label="TEL" value={stripTel(E.telefono)} />
                <InfoRow label="EMAIL" value={E.email} />
                <InfoRow label="WEB" value={cleanWeb(E.web)} />
              </View>
            </View>
          </View>
          <View style={s.headRight}>
            <Text style={s.docLabel}>{titulo}</Text>
            <Text style={s.docNum}>{numero ?? '—'}</Text>
            {fecha ? <View style={s.dateChip}><Text style={s.dateChipTxt}>{fecha}</Text></View> : null}
          </View>
        </View>
        <View style={s.accent} />

        {/* Campos (cliente/proveedor/etc.) — grid compacto, 3 por fila */}
        {campos.length > 0 ? (
          <View style={s.fields}>
            {campos.map((f, i) => (
              <View key={i} style={s.fItem}>
                <View style={s.fItemInner}>
                  <Text style={s.fItemLabel}>{String(f[0] ?? '').replace(/:$/, '').toUpperCase()}</Text>
                  <Text style={s.fItemValue}>{f[1] ?? '—'}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Monto destacado (recibo / nota crédito) */}
        {monto ? (
          <View style={s.montoBox}>
            <Text style={s.montoLabel}>{monto.label}</Text>
            <Text style={s.montoVal}>{monto.value}</Text>
            {monto.sub ? <Text style={s.montoSub}>{monto.sub}</Text> : null}
          </View>
        ) : null}

        {/* Tabla */}
        {columnas.length > 0 ? (
          <View style={s.table}>
            <View style={s.thead}>
              {columnas.map((c, i) => (
                <Text key={i} style={[s.th, ...colStyle(c)]}>{c.label}</Text>
              ))}
            </View>
            {filas.length > 0 ? filas.map((item, i) => (
              <View key={i} style={[s.tr, i % 2 === 1 && s.trAlt]} wrap={false}>
                {columnas.map((c, j) => (
                  <Text key={j} style={[s.td, c.bold && s.tdBold, ...colStyle(c)]}>{c.cell(item, i)}</Text>
                ))}
              </View>
            )) : (
              <View style={s.tr}><Text style={s.emptyRow}>Sin ítems registrados</Text></View>
            )}
          </View>
        ) : null}

        {/* Totales */}
        {totales.length > 0 ? (
          <View style={s.totalWrap}>
            <View style={s.totalBox}>
              {totales.map((t, i) => t.grand ? (
                <View key={i} style={s.totRowGrand}>
                  <Text style={s.totLabelGrand}>{t.label}</Text>
                  <Text style={s.totValGrand}>{t.value}</Text>
                </View>
              ) : (
                <View key={i} style={s.totRow}>
                  <Text style={s.totLabel}>{t.label}</Text>
                  <Text style={s.totVal}>{t.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Observaciones */}
        {observaciones ? (
          <View style={s.obsWrap}>
            <Text style={s.obsHead}>{obsLabel}</Text>
            <Text style={s.obsTxt}>{observaciones}</Text>
          </View>
        ) : null}

        {/* Firmas */}
        {firmas ? (
          <View style={s.signRow}>
            <View style={s.signCol}><Text style={s.signLabel}>{firmas[0]}</Text></View>
            <View style={s.signGap} />
            <View style={s.signCol}><Text style={s.signLabel}>{firmas[1]}</Text></View>
          </View>
        ) : null}

        {/* Pie */}
        <View style={s.footer} fixed>
          <View style={s.footLeft}>
            {logo ? <Image src={logo} style={s.footLogo} /> : null}
            <View>
              <Text style={s.footTxt}>{E.telefono}</Text>
              <Text style={s.footTxt}>{E.email}</Text>
            </View>
          </View>
          <View style={s.footRight}>
            <Text style={[s.footTxt, s.footBold, s.footAccent]}>¡GRACIAS POR SU CONFIANZA!</Text>
            <Text style={s.footTxt}>{E.direccion} · {E.ciudad}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

/** Descarga el PDF con la misma plantilla que el preview. */
export async function downloadDocPdf(config, filename) {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<DocPdf {...config} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || config.numero || 'documento'}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default DocPdf;
