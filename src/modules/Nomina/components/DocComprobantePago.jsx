import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { EMPRESA_FALLBACK } from '../../../utils/empresaInfo';
import '../../../shared/pdf/fonts';

/**
 * DocComprobantePago — comprobante de pago de nómina, breve y de verdad más
 * chico (media carta, no A4 completo) — pensado para imprimir/archivar como
 * soporte del pago, no como desprendible detallado. Mismos tokens visuales
 * que DocPdf (Outfit, negro/gris, acento amarillo de marca) pero un layout
 * propio: lo primero que se ve es el NETO PAGADO, no una tabla de conceptos.
 */
const INK = '#1a1a1a', MUTED = '#666666', HAIR = '#e5e5e5', DARK = '#1a1a1a', BRAND = '#FBBF24';

const s = StyleSheet.create({
  page: { fontFamily: 'Outfit', fontSize: 8, color: INK, backgroundColor: '#fff', padding: 20, lineHeight: 1.35 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headLeft: { flex: 1, paddingRight: 8 },
  logo: { width: 56, height: 26, objectFit: 'contain', objectPositionX: 0, marginBottom: 3 },
  coName: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 7, lineHeight: 1.15 },
  coSub: { fontSize: 6, color: MUTED, marginTop: 1 },
  headRight: { width: 82, alignItems: 'flex-end' },
  docLabel: { fontSize: 6.5, fontFamily: 'Outfit', fontWeight: 700, letterSpacing: 1, color: MUTED, textAlign: 'right' },
  docNum: { fontSize: 10.5, fontFamily: 'Outfit', fontWeight: 700, textAlign: 'right', marginTop: 2 },

  accent: { height: 2, backgroundColor: BRAND, marginTop: 10, marginBottom: 16 },

  title: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 10, textAlign: 'center', letterSpacing: 0.5 },
  empleado: { fontFamily: 'Outfit', fontWeight: 700, fontSize: 13, textAlign: 'center', marginTop: 10 },
  empleadoSub: { fontSize: 7.5, color: MUTED, textAlign: 'center', marginTop: 2 },
  empleadoSalario: { fontSize: 7, fontFamily: 'Outfit', fontWeight: 700, textAlign: 'center', marginTop: 3 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, borderTopWidth: 1, borderTopColor: HAIR, borderBottomWidth: 1, borderBottomColor: HAIR, paddingVertical: 9 },
  gItem: { width: '50%', marginBottom: 5 },
  gLabel: { fontSize: 6, fontFamily: 'Outfit', fontWeight: 700, letterSpacing: 0.3, color: '#999999' },
  gVal: { fontSize: 7.5, fontFamily: 'Outfit', fontWeight: 700, marginTop: 2 },

  montoBox: { marginTop: 20, marginHorizontal: 14, borderWidth: 1.5, borderColor: DARK, borderRadius: 6, paddingVertical: 16, alignItems: 'center' },
  montoLabel: { fontSize: 7, fontFamily: 'Outfit', fontWeight: 700, letterSpacing: 1, color: MUTED, textAlign: 'center' },
  montoVal: { fontSize: 22, fontFamily: 'Outfit', fontWeight: 700, marginTop: 5, textAlign: 'center' },
  montoSub: { fontSize: 6.5, color: MUTED, marginTop: 4, textAlign: 'center' },

  seccion: { marginTop: 16 },
  seccionHead: { fontSize: 6.5, fontFamily: 'Outfit', fontWeight: 700, letterSpacing: 0.5, color: '#999999', marginBottom: 5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: HAIR },
  rowLabel: { fontSize: 7.5 },
  rowVal: { fontSize: 7.5, fontFamily: 'Outfit' },
  rowGrand: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, marginTop: 2 },
  rowGrandLabel: { fontSize: 8, fontFamily: 'Outfit', fontWeight: 700 },
  rowGrandVal: { fontSize: 8, fontFamily: 'Outfit', fontWeight: 700 },

  saldoBox: { marginTop: 18, borderWidth: 1, borderColor: DARK, borderStyle: 'dashed', borderRadius: 5, paddingVertical: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10 },
  saldoLabel: { fontSize: 8, fontFamily: 'Outfit', fontWeight: 700 },
  saldoVal: { fontSize: 10, fontFamily: 'Outfit', fontWeight: 700 },

  signWrap: { marginTop: 30 },
  signLine: { borderTopWidth: 1, borderTopColor: INK, marginHorizontal: 20 },
  signLabel: { fontSize: 7.5, fontFamily: 'Outfit', fontWeight: 700, color: INK, textAlign: 'center', marginTop: 4 },
  signSub: { fontSize: 7, color: MUTED, textAlign: 'center', marginTop: 2 },

  footer: { marginTop: 22, borderTopWidth: 1, borderTopColor: HAIR, paddingTop: 8 },
  footTxt: { fontSize: 6, color: MUTED, textAlign: 'center' },
});

const Row = ({ label, value, grand, negative }) => (
  <View style={grand ? s.rowGrand : s.row}>
    <Text style={grand ? s.rowGrandLabel : s.rowLabel}>{label}</Text>
    <Text style={grand ? s.rowGrandVal : s.rowVal}>{negative ? '-' : ''}{value}</Text>
  </View>
);

/**
 * @param numero, fecha, empresa, logo   — igual que DocPdf
 * @param empleado  { nombre, documento (C.C., obligatorio), cargo, salarioBase }
 * @param periodo   { etiqueta, tipo, dias, estado }
 * @param devengos  { salario, auxilio, total }
 * @param deducciones { salud, pension, pctSalud, pctPension, descuentos, total }
 * @param neto      valor formateado (string)
 * @param pagado    bool — decide la etiqueta del recuadro grande (NETO
 *                  PAGADO vs NETO A PAGAR), independiente de si la caja de
 *                  saldo se muestra o no.
 * @param saldo     { pendiente: bool, value: string } | null — null cuando el saldo
 *                  pendiente coincide exactamente con el neto a pagar (nada
 *                  abonado aún): mostrarlo sería redundante con la caja de
 *                  arriba, así que en ese caso no se pasa saldo.
 * @param docTitle  metadata del PDF
 */
/**
 * Alto de página calculado a partir del contenido real, en vez de un número
 * fijo "adivinado". La estructura es mayormente fija (header, grid, montoBox,
 * devengos, firma, footer) — lo único que varía es: la línea de salario base
 * (opcional), la fila de "Descuentos" en deducciones (opcional), y la caja de
 * saldo pendiente (opcional). Cada uno suma su alto real solo si está presente.
 * BASE incluye ya un margen de seguridad para redondeo de line-height y textos
 * que puedan ocupar una línea extra (nombre de empresa/empleado largos).
 */
const ALTO_BASE = 660;
const ALTO_SALARIO_BASE = 14;
const ALTO_FILA_DESCUENTOS = 19;
const ALTO_CAJA_SALDO = 55;

const calcularAltoPagina = ({ empleado, deducciones, saldo }) =>
  ALTO_BASE
  + (empleado?.salarioBase ? ALTO_SALARIO_BASE : 0)
  + (deducciones?.descuentos ? ALTO_FILA_DESCUENTOS : 0)
  + (saldo ? ALTO_CAJA_SALDO : 0);

export const DocComprobantePago = ({
  numero, fecha, empresa: E = EMPRESA_FALLBACK, logo,
  empleado, periodo, devengos, deducciones, neto, pagado, saldo, docTitle,
}) => (
  <Document title={docTitle || `Comprobante ${numero || ''}`.trim()} author={E.nombre}>
    <Page size={[300, calcularAltoPagina({ empleado, deducciones, saldo })]} style={s.page}>
      <View style={s.header}>
        <View style={s.headLeft}>
          {logo ? <Image src={logo} style={s.logo} /> : null}
          <Text style={s.coName}>{E.nombre}</Text>
          <Text style={s.coSub}>NIT {String(E.nit ?? '').replace(/^\s*nit[:.]?\s*/i, '')}</Text>
        </View>
        <View style={s.headRight}>
          <Text style={s.docLabel}>COMPROBANTE</Text>
          <Text style={s.docNum}>{numero ?? '—'}</Text>
        </View>
      </View>
      <View style={s.accent} />

      <Text style={s.title}>PAGO DE NÓMINA</Text>
      <Text style={s.empleado}>{empleado.nombre}</Text>
      <Text style={s.empleadoSub}>
        {empleado.cargo ? `${empleado.cargo} · ` : ''}C.C. {empleado.documento}
      </Text>
      {empleado.salarioBase ? (
        <Text style={s.empleadoSalario}>Salario base mensual: {empleado.salarioBase}</Text>
      ) : null}

      <View style={s.grid}>
        <View style={s.gItem}><Text style={s.gLabel}>PERÍODO</Text><Text style={s.gVal}>{periodo.etiqueta}</Text></View>
        <View style={s.gItem}><Text style={s.gLabel}>FECHA</Text><Text style={s.gVal}>{fecha}</Text></View>
        <View style={s.gItem}><Text style={s.gLabel}>DÍAS TRABAJADOS</Text><Text style={s.gVal}>{periodo.dias}</Text></View>
        <View style={s.gItem}><Text style={s.gLabel}>ESTADO</Text><Text style={s.gVal}>{periodo.estado}</Text></View>
      </View>

      <View style={s.montoBox}>
        <Text style={s.montoLabel}>{pagado ? 'NETO PAGADO' : 'NETO A PAGAR'}</Text>
        <Text style={s.montoVal}>{neto}</Text>
      </View>

      <View style={s.seccion}>
        <Text style={s.seccionHead}>DEVENGOS</Text>
        <Row label="Salario devengado" value={devengos.salario} />
        <Row label="Auxilio de transporte" value={devengos.auxilio} />
        <Row label="Total devengado" value={devengos.total} grand />
      </View>

      <View style={s.seccion}>
        <Text style={s.seccionHead}>DEDUCCIONES</Text>
        <Row label={`Salud (${deducciones.pctSalud}%)`} value={deducciones.salud} negative />
        <Row label={`Pensión (${deducciones.pctPension}%)`} value={deducciones.pension} negative />
        {deducciones.descuentos ? <Row label="Descuentos" value={deducciones.descuentos} negative /> : null}
        <Row label="Total deducciones" value={deducciones.total} grand negative />
      </View>

      {saldo ? (
        <View style={s.saldoBox}>
          <Text style={s.saldoLabel}>{saldo.pendiente ? 'SALDO PENDIENTE' : 'SALDO (PAGADO)'}</Text>
          <Text style={s.saldoVal}>{saldo.value}</Text>
        </View>
      ) : null}

      <View style={s.signWrap}>
        <View style={s.signLine} />
        <Text style={s.signLabel}>Firma del Empleado</Text>
        <Text style={s.signSub}>C.C. {empleado.documento}</Text>
      </View>

      <View style={s.footer}>
        <Text style={s.footTxt}>{E.telefono} · {E.email}</Text>
      </View>
    </Page>
  </Document>
);

export default DocComprobantePago;
