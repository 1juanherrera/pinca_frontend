import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { EMPRESA_FALLBACK } from '../../../utils/empresaInfo';
import '../../../shared/pdf/fonts';

/**
 * EJEMPLO — mismo esqueleto visual que `CotizacionFactusStyleDoc`/`RemisionFactusStyleDoc`
 * (inspirado en Factus), adaptado a un recibo de pago: no hay tabla de ítems
 * (un recibo no factura productos), así que el panel de datos + el "monto
 * recibido" ocupan el lugar de la tabla/totales.
 *
 * Standalone — no toca `shared/pdf/DocPdf.jsx` ni `ExportRecibo.jsx` original.
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

  panel: { flexDirection: 'row', borderWidth: 1, borderColor: BORDER, marginBottom: 16 },
  panelCol: { flex: 1, padding: 6 },
  panelColBorder: { borderRightWidth: 1, borderRightColor: BORDER },
  panelRow: { flexDirection: 'row', marginBottom: 2 },
  panelLabel: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 7, width: 62, color: INK },
  panelValue: { fontSize: 7.5, color: INK, flex: 1 },

  montoBox: { borderWidth: 1.5, borderColor: INK, paddingVertical: 18, alignItems: 'center', marginBottom: 16 },
  montoLabel: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 8, letterSpacing: 1, color: MUTED },
  montoVal: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 26, color: INK, marginTop: 6, lineHeight: 1 },
  montoSub: { fontSize: 8, color: MUTED, marginTop: 6, letterSpacing: 0.5 },

  obsHead: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 7.5, marginBottom: 3 },
  obsTxt: { fontSize: 7.5, color: MUTED, lineHeight: 1.5 },

  signRow: { flexDirection: 'row', marginTop: 26 },
  signCol: { flex: 1, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 5 },
  signGap: { width: 40 },
  signLabel: { fontSize: 7.5, color: MUTED },

  finePrint: { marginTop: 20, textAlign: 'center', fontSize: 6.5, color: FAINT },
});

const money = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;
const tipoLabel = (t) => (t === 'pago_total' ? 'PAGO TOTAL' : t === 'abono' ? 'ABONO PARCIAL' : t === 'anticipo' ? 'ANTICIPO' : (t || ''));

/**
 * @param numero         Referencia del recibo
 * @param fecha          Fecha del pago
 * @param empresa        Shape de useEmpresaInfo()
 * @param logo           Logo base64/URL
 * @param cliente        { nombre, documento }
 * @param metodo         Método de pago
 * @param facturaNumero  Número de la factura asociada
 * @param monto          Valor recibido
 * @param tipo           'pago_total' | 'abono' | 'anticipo'
 * @param observaciones  string opcional
 */
export const ReciboFactusStyleDoc = ({
  numero, fecha, empresa: E = EMPRESA_FALLBACK, logo,
  cliente = {}, metodo, facturaNumero, monto, tipo, observaciones,
}) => {
  return (
    <Document title={`Recibo ${numero || ''}`.trim()} author={E.nombre}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.headLeft}>
            {logo ? <Image src={logo} style={s.logo} /> : null}
          </View>
          <View style={s.headRight}>
            <Text style={s.docTitle}>RECIBO DE PAGO</Text>
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
            <View style={s.panelRow}><Text style={s.panelLabel}>Factura:</Text><Text style={s.panelValue}>{facturaNumero ?? '—'}</Text></View>
          </View>
          <View style={s.panelCol}>
            <View style={s.panelRow}><Text style={s.panelLabel}>Fecha:</Text><Text style={s.panelValue}>{fecha ?? '—'}</Text></View>
            <View style={s.panelRow}><Text style={s.panelLabel}>Método:</Text><Text style={s.panelValue}>{metodo ?? '—'}</Text></View>
          </View>
        </View>

        <View style={s.montoBox}>
          <Text style={s.montoLabel}>MONTO RECIBIDO</Text>
          <Text style={s.montoVal}>{money(monto)}</Text>
          <Text style={s.montoSub}>{tipoLabel(tipo)}</Text>
        </View>

        {observaciones ? (
          <>
            <Text style={s.obsHead}>Observaciones</Text>
            <Text style={s.obsTxt}>{observaciones}</Text>
          </>
        ) : null}

        <View style={s.signRow}>
          <View style={s.signCol}><Text style={s.signLabel}>Recibido por (Pinca)</Text></View>
          <View style={s.signGap} />
          <View style={s.signCol}><Text style={s.signLabel}>Cliente / Pagador</Text></View>
        </View>

        <Text style={s.finePrint}>Recibo generado por el sistema ERP de {E.nombre}. No constituye una factura de venta.</Text>
      </Page>
    </Document>
  );
};

export default ReciboFactusStyleDoc;
