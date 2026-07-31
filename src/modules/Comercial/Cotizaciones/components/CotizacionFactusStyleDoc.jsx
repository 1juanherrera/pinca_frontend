import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { EMPRESA_FALLBACK } from '../../../../utils/empresaInfo';
import '../../../../shared/pdf/fonts';

/**
 * EJEMPLO — layout alternativo inspirado en la estructura visual de Factus
 * (proveedor de facturación electrónica DIAN en evaluación): header en 2
 * columnas (logo a la izquierda | título+datos legales alineados a la
 * derecha), panel de datos del cliente con grilla completa, tabla con
 * columna "#" y descuento/IVA por línea, caja de totales tipo
 * Valor Bruto/Base/IVA/Total.
 *
 * Standalone a propósito — NO reemplaza `shared/pdf/DocPdf.jsx` (que usan
 * Factura/Cotización/OC/Recibo/NotaCredito/Desprendible) ni toca
 * `ExportCotizacion.jsx`. Es un segundo estilo posible, no wireado a la UI.
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
  logoName: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 15, color: INK, marginTop: 2 },

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
  colNum2: { width: 60, textAlign: 'right' },
  colQty: { width: 45, textAlign: 'right' },
  colPct: { width: 45, textAlign: 'right' },
  colTot: { width: 65, textAlign: 'right', borderRightWidth: 0 },

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

  footRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  footBlock: { width: 250 },
  footHead: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 7.5, marginBottom: 3 },
  footLine: { fontSize: 7.5, color: MUTED },

  finePrint: { marginTop: 20, textAlign: 'center', fontSize: 6.5, color: FAINT },
});

const money = (n) => `$${Number(n || 0).toLocaleString('es-CO')}`;

/**
 * @param numero        Número de cotización (ej. 'COT-2026-0001')
 * @param fecha         Fecha de emisión (string ya formateada)
 * @param vencimiento   Fecha de vigencia/vencimiento
 * @param empresa       Shape de useEmpresaInfo() — logo se pasa aparte
 * @param logo          Logo base64/URL
 * @param cliente       { nombre, documento, ciudad, direccion, email }
 * @param items         [{ codigo, descripcion, valorUnit, cantidad, descuentoPct, ivaPct }]
 * @param condiciones   string (ej. 'Precios sujetos a cambio sin previo aviso')
 * @param vigenciaDias  number
 * @param observaciones string opcional
 */
export const CotizacionFactusStyleDoc = ({
  numero, fecha, vencimiento, empresa: E = EMPRESA_FALLBACK, logo,
  cliente = {}, items = [], condiciones, vigenciaDias = 30, observaciones,
}) => {
  const filas = items.map((it) => {
    const bruto = Number(it.valorUnit || 0) * Number(it.cantidad || 0);
    const descuento = bruto * (Number(it.descuentoPct || 0) / 100);
    const base = bruto - descuento;
    const iva = base * (Number(it.ivaPct ?? 19) / 100);
    return { ...it, bruto, descuento, base, iva, total: base + iva };
  });

  const valorBruto = filas.reduce((a, f) => a + f.bruto, 0);
  const descuentoTotal = filas.reduce((a, f) => a + f.descuento, 0);
  const baseImponible = valorBruto - descuentoTotal;
  const ivaTotal = filas.reduce((a, f) => a + f.iva, 0);
  const total = baseImponible + ivaTotal;

  return (
    <Document title={`Cotización ${numero || ''}`.trim()} author={E.nombre}>
      <Page size="A4" style={s.page}>
        {/* Encabezado — 3 columnas, como Factus */}
        <View style={s.header}>
          <View style={s.headLeft}>
            {logo ? <Image src={logo} style={s.logo} /> : null}
          </View>
          <View style={s.headRight}>
            <Text style={s.docTitle}>COTIZACIÓN</Text>
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

        {/* Panel de datos — grilla completa, como el bloque cliente/fechas de Factus */}
        <View style={s.panel}>
          <View style={[s.panelCol, s.panelColBorder]}>
            <View style={s.panelRow}><Text style={s.panelLabel}>Cliente:</Text><Text style={s.panelValue}>{cliente.nombre ?? '—'}</Text></View>
            <View style={s.panelRow}><Text style={s.panelLabel}>NIT/CC:</Text><Text style={s.panelValue}>{cliente.documento ?? '—'}</Text></View>
            <View style={s.panelRow}><Text style={s.panelLabel}>Ciudad:</Text><Text style={s.panelValue}>{cliente.ciudad ?? '—'}</Text></View>
            <View style={s.panelRow}><Text style={s.panelLabel}>Dirección:</Text><Text style={s.panelValue}>{cliente.direccion ?? '—'}</Text></View>
            <View style={s.panelRow}><Text style={s.panelLabel}>Email:</Text><Text style={s.panelValue}>{cliente.email ?? '—'}</Text></View>
          </View>
          <View style={s.panelCol}>
            <View style={s.panelRow}><Text style={s.panelLabel}>F. emisión:</Text><Text style={s.panelValue}>{fecha ?? '—'}</Text></View>
            <View style={s.panelRow}><Text style={s.panelLabel}>Vigencia:</Text><Text style={s.panelValue}>{vencimiento ?? '—'} ({vigenciaDias} días)</Text></View>
          </View>
        </View>

        {/* Tabla — # / Código / Descripción / Val.Unit / Cantidad / Descuento / IVA / Val.Item, como Factus */}
        <View style={s.table}>
          <View style={s.thead}>
            <Text style={[s.th, s.colNum]}>#</Text>
            <Text style={[s.th, s.colCod]}>Código</Text>
            <Text style={[s.th, s.colDesc]}>Descripción</Text>
            <Text style={[s.th, s.colNum2]}>Val. Unit</Text>
            <Text style={[s.th, s.colQty]}>Cantidad</Text>
            <Text style={[s.th, s.colPct]}>Descuento</Text>
            <Text style={[s.th, s.colPct]}>IVA</Text>
            <Text style={[s.th, s.colTot]}>Val. Item</Text>
          </View>
          {filas.map((f, i) => (
            <View key={i} style={s.tr} wrap={false}>
              <Text style={[s.td, s.colNum]}>{i + 1}</Text>
              <Text style={[s.td, s.colCod]}>{f.codigo}</Text>
              <Text style={[s.td, s.colDesc]}>{f.descripcion}</Text>
              <Text style={[s.td, s.colNum2]}>{money(f.valorUnit)}</Text>
              <Text style={[s.td, s.colQty]}>{f.cantidad}</Text>
              <Text style={[s.td, s.colPct]}>{f.descuentoPct ?? 0}%</Text>
              <Text style={[s.td, s.colPct]}>{f.ivaPct ?? 19}%</Text>
              <Text style={[s.td, s.colTot]}>{money(f.total)}</Text>
            </View>
          ))}
        </View>

        {/* Observaciones + totales, como el bloque Observaciones/Valor Bruto de Factus */}
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
            <View style={s.totalsRow}><Text style={s.totalsLabel}>Valor Bruto</Text><Text style={s.totalsVal}>{money(valorBruto)}</Text></View>
            <View style={s.totalsRow}><Text style={s.totalsLabel}>Base Imponible</Text><Text style={s.totalsVal}>{money(baseImponible)}</Text></View>
            <View style={s.totalsRow}><Text style={s.totalsLabel}>IVA</Text><Text style={s.totalsVal}>{money(ivaTotal)}</Text></View>
            <View style={s.totalsRow}><Text style={s.totalsLabel}>Descuento(-)</Text><Text style={s.totalsVal}>{money(descuentoTotal)}</Text></View>
            <View style={[s.totalsRow, s.totalsRowLast]}>
              <Text style={s.totalsLabelGrand}>Total</Text>
              <Text style={s.totalsValGrand}>{money(total)}</Text>
            </View>
          </View>
        </View>

        {/* Condiciones — reemplaza el bloque "Tipo de operación / Detalles de pago" de Factus */}
        <View style={s.footRow}>
          <View style={s.footBlock}>
            <Text style={s.footHead}>Condiciones</Text>
            <Text style={s.footLine}>{condiciones ?? 'Precios sujetos a cambio sin previo aviso. No incluye transporte salvo que se indique.'}</Text>
          </View>
          <View style={s.footBlock}>
            <Text style={s.footHead}>Vigencia de la oferta</Text>
            <Text style={s.footLine}>Esta cotización es válida por {vigenciaDias} días desde la fecha de emisión.</Text>
          </View>
        </View>

        <Text style={s.finePrint}>Cotización generada por el sistema ERP de {E.nombre}. No constituye una factura de venta.</Text>
      </Page>
    </Document>
  );
};

export async function downloadCotizacionFactusStyle(config, filename) {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<CotizacionFactusStyleDoc {...config} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || config.numero || 'cotizacion'}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default CotizacionFactusStyleDoc;
