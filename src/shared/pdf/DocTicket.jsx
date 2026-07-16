import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { EMPRESA_FALLBACK } from '../../utils/empresaInfo';

/**
 * Factura / recibo en estilo POS monoespaciado, impreso en A4 (columna angosta
 * centrada, líneas punteadas) — para imprimir en papel normal. Reusa la MISMA
 * config que DocPdf (titulo, campos, columnas, filas, totales, monto…).
 * Deriva cant/precio/total de las columnas por convención.
 */
const stripNit = (n) => String(n ?? '').replace(/^\s*nit[:.]?\s*/i, '');
const stripTel = (t) => String(t ?? '').replace(/^\s*tel[:.]?\s*/i, '');
const cleanWeb = (w) => String(w ?? '').replace(/^https?:\/\//i, '').replace(/\/+$/, '');

const INK = '#1a1a1a', MUTED = '#555555', LINE = '#999999';

const s = StyleSheet.create({
  page: { fontFamily: 'Courier', fontSize: 8.5, color: INK, backgroundColor: '#fff', paddingVertical: 34, lineHeight: 1.4, alignItems: 'center' },
  sheet: { width: 360 },

  center: { textAlign: 'center' },
  coName: { fontFamily: 'Courier-Bold', fontSize: 9.5, textAlign: 'center' },
  small: { fontSize: 8, textAlign: 'center', color: MUTED },
  spacer: { height: 8 },
  dash: { borderBottomWidth: 1, borderBottomColor: LINE, borderStyle: 'dashed', marginVertical: 6 },
  solid: { borderBottomWidth: 1.2, borderBottomColor: INK, marginVertical: 6 },

  docTitle: { fontFamily: 'Courier-Bold', fontSize: 9.5, textAlign: 'center', letterSpacing: 1 },
  docNum: { fontFamily: 'Courier-Bold', fontSize: 9.5, textAlign: 'center', marginTop: 1 },
  docDate: { fontSize: 8, textAlign: 'center', color: MUTED, marginTop: 1 },

  field: { flexDirection: 'row', marginBottom: 1.5 },
  fieldLabel: { fontFamily: 'Courier-Bold', width: 92 },
  fieldVal: { flex: 1 },

  colHead: { flexDirection: 'row', justifyContent: 'space-between' },
  colHeadTxt: { fontFamily: 'Courier-Bold', fontSize: 8 },
  itemDesc: { fontSize: 8.5 },
  itemLine: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 10 },
  itemQty: { fontSize: 8.5, color: MUTED },
  itemTot: { fontSize: 8.5, fontFamily: 'Courier-Bold' },

  totRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1.5, paddingLeft: 24 },
  totLabel: { fontSize: 8.5 },
  totVal: { fontSize: 8.5 },
  grandRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 3, borderTopWidth: 1, borderTopColor: INK, paddingTop: 3, paddingLeft: 24 },
  grandTxt: { fontFamily: 'Courier-Bold', fontSize: 10 },

  montoLabel: { fontSize: 8, textAlign: 'center', color: MUTED, fontFamily: 'Courier-Bold', letterSpacing: 0.5 },
  montoVal: { fontSize: 17, textAlign: 'center', fontFamily: 'Courier-Bold', marginTop: 3 },
  montoSub: { fontSize: 7.5, textAlign: 'center', color: MUTED, marginTop: 2 },

  obsHead: { fontFamily: 'Courier-Bold', fontSize: 8 },
  obs: { fontSize: 8.5, color: INK },
  footThanks: { fontFamily: 'Courier-Bold', fontSize: 9, textAlign: 'center', marginTop: 4 },
});

const col = (columnas, re) => columnas.find((c) => re.test(c.label));

export const DocTicket = ({
  titulo, numero, fecha, empresa: E = EMPRESA_FALLBACK,
  campos = [], columnas = [], filas = [], totales = [], monto = null,
  observaciones, obsLabel = 'OBSERVACIONES', docTitle,
}) => {
  const descCol = columnas.find((c) => c.desc) || columnas.find((c) => c.flex);
  const cantCol = col(columnas, /^cant/i);
  const precioCol = col(columnas, /^vr/i) || col(columnas, /unit/i);
  const totalCol = [...columnas].reverse().find((c) => c.bold) || columnas[columnas.length - 1];

  return (
    <Document title={docTitle || `${titulo} ${numero || ''}`.trim()} author={E.nombre}>
      <Page size="A4" style={s.page}>
        <View style={s.sheet}>
          <Text style={s.coName}>{E.nombre}</Text>
          <Text style={s.small}>NIT {stripNit(E.nit)}</Text>
          <Text style={s.small}>{E.direccion} · {E.ciudad}</Text>
          <Text style={s.small}>Tel {stripTel(E.telefono)} · {cleanWeb(E.web)}</Text>

          <View style={s.spacer} />
          <Text style={s.docTitle}>{titulo}</Text>
          <Text style={s.docNum}>{numero ?? '—'}</Text>
          {fecha ? <Text style={s.docDate}>{fecha}</Text> : null}

          {campos.length > 0 ? (
            <>
              <View style={s.dash} />
              {campos.filter((f) => f && f[1]).map((f, i) => (
                <View key={i} style={s.field}>
                  <Text style={s.fieldLabel}>{f[0]}</Text>
                  <Text style={s.fieldVal}>{f[1]}</Text>
                </View>
              ))}
            </>
          ) : null}

          {monto ? (
            <>
              <View style={s.dash} />
              <Text style={s.montoLabel}>{monto.label}</Text>
              <Text style={s.montoVal}>{monto.value}</Text>
              {monto.sub ? <Text style={s.montoSub}>{monto.sub}</Text> : null}
            </>
          ) : null}

          {filas.length > 0 && descCol ? (
            <>
              <View style={s.dash} />
              <View style={s.colHead}>
                <Text style={s.colHeadTxt}>CANT · DESCRIPCIÓN</Text>
                {totalCol && precioCol ? <Text style={s.colHeadTxt}>TOTAL</Text> : null}
              </View>
              <View style={s.dash} />
              {filas.map((item, i) => (
                <View key={i} style={{ marginBottom: 4 }} wrap={false}>
                  <Text style={s.itemDesc}>{descCol.cell(item, i)}</Text>
                  <View style={s.itemLine}>
                    <Text style={s.itemQty}>
                      {cantCol ? cantCol.cell(item, i) : ''}{precioCol ? ` x ${precioCol.cell(item, i)}` : ''}
                    </Text>
                    {totalCol && precioCol ? <Text style={s.itemTot}>{totalCol.cell(item, i)}</Text> : null}
                  </View>
                </View>
              ))}
            </>
          ) : null}

          {totales.length > 0 ? (
            <>
              <View style={s.dash} />
              {totales.map((t, i) => t.grand ? (
                <View key={i} style={s.grandRow}>
                  <Text style={s.grandTxt}>{t.label}</Text>
                  <Text style={s.grandTxt}>{t.value}</Text>
                </View>
              ) : (
                <View key={i} style={s.totRow}>
                  <Text style={s.totLabel}>{t.label}</Text>
                  <Text style={s.totVal}>{t.value}</Text>
                </View>
              ))}
            </>
          ) : null}

          {observaciones ? (
            <>
              <View style={s.dash} />
              <Text style={s.obsHead}>{obsLabel}</Text>
              <Text style={s.obs}>{observaciones}</Text>
            </>
          ) : null}

          <View style={s.solid} />
          <Text style={s.footThanks}>¡GRACIAS POR SU CONFIANZA!</Text>
          <Text style={s.small}>{E.email}</Text>
          <Text style={s.small}>{cleanWeb(E.web)}</Text>
          <View style={s.dash} />
        </View>
      </Page>
    </Document>
  );
};

/** Descarga el recibo/factura POS (A4). */
export async function downloadDocTicket(config, filename) {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<DocTicket {...config} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename || config.numero || 'tiquete'}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default DocTicket;
