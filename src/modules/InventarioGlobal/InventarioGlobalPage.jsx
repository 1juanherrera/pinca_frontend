import { useState } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import {
  ChevronDown, ChevronRight, RefreshCw, AlertTriangle,
  Package, DollarSign, FileSpreadsheet, FileText, Boxes, Search,
} from 'lucide-react';
import { useInventarioGlobal } from './api/useInventarioGlobal';
import HeaderSection from '../../shared/HeaderSection';
import { FullPageLoader } from '../../shared/Loader';
import SummaryCard from '../../shared/SummaryCard';
import { fmt } from '../../utils/formatters';
import logo from '../../assets/pincaicono.png';

// ── Constantes ────────────────────────────────────────────────────────────────

const EMPRESA = {
  nombre:    'PINTURAS INDUSTRIALES DEL CARIBE S.A.S',
  nit:       'NIT 901.314.182-9',
  direccion: 'Calle 99 # 6-59',
  telefono:  'Tel: 3145973532',
  ciudad:    'Barranquilla - Colombia',
  email:     'pinca.sas@hotmail.com',
  celular:   '+57 3019794729',
  web:       'www.pinca.com.co',
};

const TIPO_TABS = [
  { label: 'Todos',           tipo: null },
  { label: 'Materias Primas', tipo: 1    },
  { label: 'Productos',       tipo: 0    },
  { label: 'Insumos',         tipo: 2    },
];

const TIPO_BADGE = {
  0: 'bg-blue-100   text-blue-800   border border-blue-200',
  1: 'bg-amber-100  text-amber-800  border border-amber-200',
  2: 'bg-violet-100 text-violet-800 border border-violet-200',
};
const TIPO_LABEL = { 0: 'Producto', 1: 'Materia Prima', 2: 'Insumo' };

const fmtNum = (n, dec = 2) =>
  new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec }).format(n ?? 0);

// ── Semáforo ──────────────────────────────────────────────────────────────────

const BASE_BADGE = 'inline-flex items-center justify-center gap-1.5 w-24 px-2 py-0.5 rounded font-semibold text-xs';

const DiasRestantes = ({ dias }) => {
  if (dias === null) return (
    <span className={`${BASE_BADGE} bg-zinc-100 text-zinc-500 border border-zinc-200`}>
      Sin datos
    </span>
  );
  if (dias < 10) return (
    <span className={`${BASE_BADGE} bg-red-100 text-red-700 border border-red-200`}>
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
      {dias}d crítico
    </span>
  );
  if (dias < 30) return (
    <span className={`${BASE_BADGE} bg-amber-100 text-amber-700 border border-amber-200`}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
      {dias}d
    </span>
  );
  return (
    <span className={`${BASE_BADGE} bg-emerald-100 text-emerald-700 border border-emerald-200`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
      {dias}d
    </span>
  );
};

// ── Fila expandible ───────────────────────────────────────────────────────────

const ItemRow = ({ item, index }) => {
  const [open, setOpen] = useState(false);
  const hasBodegas = item.stock_por_bodega.length > 0;
  const sinStock   = item.stock_total === 0;

  return (
    <>
      <tr
        onClick={() => hasBodegas && setOpen((o) => !o)}
        className={`
          border-b border-zinc-100 text-sm transition-colors
          ${open ? 'bg-indigo-50' : index % 2 === 0 ? 'bg-white' : 'bg-zinc-50'}
          ${hasBodegas ? 'cursor-pointer hover:bg-indigo-50' : 'hover:bg-zinc-50'}
        `}
      >
        {/* Expand */}
        <td className="pl-4 pr-2 py-3 w-8">
          {hasBodegas
            ? (open
                ? <ChevronDown size={14} className="text-indigo-500" />
                : <ChevronRight size={14} className="text-zinc-400" />)
            : null}
        </td>

        {/* # */}
        <td className="px-2 py-3 text-xs text-zinc-400 tabular-nums w-10 text-center">
          {index + 1}
        </td>

        {/* Ítem */}
        <td className="px-3 py-3 min-w-[200px]">
          <p className="font-semibold text-zinc-900">{item.nombre}</p>
          <p className="text-zinc-500 text-xs mt-0.5 font-mono">{item.codigo}</p>
        </td>

        {/* Tipo */}
        <td className="px-3 py-3">
          <span className={`inline-flex items-center justify-center w-28 text-xs px-2 py-1 rounded font-semibold ${TIPO_BADGE[item.tipo] ?? ''}`}>
            {TIPO_LABEL[item.tipo] ?? '—'}
          </span>
        </td>

        {/* Stock */}
        <td className="px-3 py-3 text-right tabular-nums">
          {sinStock ? (
            <span className="text-zinc-400 text-xs italic">Sin stock</span>
          ) : (
            <span>
              <span className="font-bold text-zinc-900">{fmtNum(item.stock_total)}</span>
              <span className="text-zinc-500 text-xs ml-1">{item.unidad_base}</span>
            </span>
          )}
        </td>

        {/* Bodegas */}
        <td className="px-3 py-3 text-center">
          {item.bodegas_con_stock > 0 ? (
            <span className="inline-flex items-center justify-center w-24 gap-1 text-xs font-medium text-zinc-700 bg-zinc-100 border border-zinc-200 px-2 py-1 rounded">
              {item.bodegas_con_stock} {item.bodegas_con_stock === 1 ? 'bodega' : 'bodegas'}
            </span>
          ) : (
            <span className="text-zinc-400 text-xs">—</span>
          )}
        </td>

        {/* Costo promedio */}
        <td className="px-3 py-3 text-right tabular-nums">
          {item.costo_promedio > 0 ? (
            <span>
              <span className="font-medium text-zinc-800">{fmt(item.costo_promedio)}</span>
              <span className="text-zinc-500 text-xs ml-1">/{item.unidad_base}</span>
            </span>
          ) : (
            <span className="text-zinc-400 text-xs">—</span>
          )}
        </td>

        {/* Valor inventario */}
        <td className="px-3 py-3 text-right tabular-nums">
          {item.valor_inventario > 0 ? (
            <span className="font-bold text-zinc-900">{fmt(item.valor_inventario)}</span>
          ) : (
            <span className="text-zinc-400 text-xs">—</span>
          )}
        </td>

        {/* Consumo 30d */}
        <td className="px-3 py-3 text-right tabular-nums text-zinc-700 text-sm">
          {item.consumo_30_dias
            ? <span>{fmtNum(item.consumo_30_dias, 1)} <span className="text-zinc-500 text-xs">{item.unidad_base}</span></span>
            : <span className="text-zinc-400 text-xs">—</span>}
        </td>

        {/* Días restantes */}
        <td className="px-3 py-3 text-center">
          <DiasRestantes dias={item.dias_restantes} />
        </td>
      </tr>

      {/* Desglose bodegas */}
      {open && (
        <tr className="border-b border-indigo-100 bg-indigo-50/60">
          <td colSpan={10} className="px-10 py-4">
            <p className="text-xs font-bold text-zinc-600 uppercase tracking-wider mb-3">
              Stock por bodega
            </p>
            <div className="flex flex-wrap gap-2">
              {item.stock_por_bodega.map((b) => (
                <div
                  key={b.bodega_id}
                  className="bg-white border border-indigo-100 rounded-xl px-4 py-3 min-w-40 shadow-sm"
                >
                  <p className="font-semibold text-zinc-800 text-sm">{b.bodega}</p>
                  {b.instalacion && (
                    <p className="text-zinc-500 text-xs mt-0.5">{b.instalacion}</p>
                  )}
                  <p className="font-bold text-zinc-900 mt-2 text-base tabular-nums">
                    {fmtNum(b.cantidad)}{' '}
                    <span className="font-normal text-zinc-500 text-sm">{item.unidad_base}</span>
                  </p>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ── Exportar Excel ────────────────────────────────────────────────────────────

const exportarExcel = (items, tipoLabel) => {
  if (!items.length) { toast.error('No hay datos para exportar'); return; }

  const rows = items.map((item, i) => ({
    '#':               i + 1,
    'Código':          item.codigo ?? '—',
    'Nombre':          item.nombre,
    'Tipo':            TIPO_LABEL[item.tipo] ?? '—',
    'Unidad Base':     item.unidad_base ?? '—',
    'Stock Total':     parseFloat((item.stock_total ?? 0).toFixed(4)),
    'Bodegas c/Stock': item.bodegas_con_stock,
    'Costo Promedio':  parseFloat((item.costo_promedio ?? 0).toFixed(2)),
    'Valor Inventario':parseFloat((item.valor_inventario ?? 0).toFixed(2)),
    'Consumo 30d':     item.consumo_30_dias ? parseFloat(item.consumo_30_dias.toFixed(4)) : 0,
    'Días Restantes':  item.dias_restantes ?? 'Sin datos',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0]).map((key) => ({
    wch: Math.max(key.length, ...rows.map((r) => String(r[key] ?? '').length)) + 2,
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, tipoLabel);

  const fecha = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `inventario_${tipoLabel.toLowerCase().replace(/ /g, '_')}_${fecha}.xlsx`);
  toast.success(`${items.length} registros exportados a Excel`);
};

// ── Exportar PDF ──────────────────────────────────────────────────────────────

const exportarPdf = async (items, tipoLabel) => {
  if (!items.length) { toast.error('No hay datos para exportar'); return; }

  try {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const logoBase64 = await fetch(logo).then((r) => r.blob()).then(
      (b) => new Promise((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.readAsDataURL(b);
      })
    );

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297, M = 14;

    // Barra superior
    doc.setFillColor(17, 24, 39);
    doc.rect(0, 0, W, 4, 'F');

    // Logo
    doc.addImage(logoBase64, 'PNG', M, 8, 20, 20);

    // Datos empresa
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(17, 24, 39);
    doc.text(EMPRESA.nombre, 37, 14);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(107, 114, 128);
    doc.text(`${EMPRESA.nit} · ${EMPRESA.telefono}`, 37, 19);
    doc.text(`${EMPRESA.direccion} · ${EMPRESA.ciudad}`, 37, 23.5);
    doc.text(EMPRESA.web, 37, 28);

    // Título (derecha)
    const fecha = new Date().toLocaleDateString('es-CO');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(107, 114, 128);
    doc.text(`INVENTARIO — ${tipoLabel.toUpperCase()}`, W - M, 12, { align: 'right' });
    doc.setFillColor(17, 24, 39);
    doc.roundedRect(W - M - 52, 14.5, 52, 9, 2, 2, 'F');
    doc.setFontSize(9.5); doc.setTextColor(255);
    doc.text(`${items.length} registros`, W - M - 26, 20.5, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(156, 163, 175);
    doc.text(`Generado: ${fecha}`, W - M, 27, { align: 'right' });

    // Separador
    doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.4);
    doc.line(M, 33, W - M, 33);

    // Bloques resumen
    const totalValor = items.reduce((s, i) => s + (i.valor_inventario || 0), 0);
    const totalStock = items.reduce((s, i) => s + (i.stock_total     || 0), 0);
    const criticos   = items.filter((i) => i.dias_restantes !== null && i.dias_restantes < 10).length;

    const bloques = [
      { label: 'Total Ítems',       value: items.length.toString() },
      { label: 'Unidades en Stock', value: Number(totalStock.toFixed(0)).toLocaleString('es-CO') },
      { label: 'Stock Crítico',     value: criticos.toString() },
      { label: 'Valor Inventario',  value: fmt(totalValor) },
    ];

    const bW = (W - M * 2 - 9) / 4;
    bloques.forEach(({ label, value }, i) => {
      const x = M + i * (bW + 3);
      doc.setFillColor(249, 250, 251); doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3);
      doc.roundedRect(x, 37, bW, 16, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(6); doc.setTextColor(156, 163, 175);
      doc.text(label.toUpperCase(), x + 4, 42);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(17, 24, 39);
      doc.text(value, x + 4, 49);
    });

    // Tabla
    autoTable(doc, {
      startY: 58,
      head: [['#', 'Código', 'Nombre', 'Tipo', 'Unidad', 'Stock Total', 'Costo Prom.', 'Valor Inv.', 'Consumo 30d', 'Días Rest.']],
      body: items.map((item, i) => [
        i + 1,
        item.codigo ?? '—',
        item.nombre,
        TIPO_LABEL[item.tipo] ?? '—',
        item.unidad_base ?? '—',
        fmtNum(item.stock_total),
        item.costo_promedio  > 0 ? fmt(item.costo_promedio)  : '—',
        item.valor_inventario > 0 ? fmt(item.valor_inventario) : '—',
        item.consumo_30_dias ? fmtNum(item.consumo_30_dias, 1) : '—',
        item.dias_restantes  !== null ? `${item.dias_restantes}d` : '—',
      ]),
      styles:             { fontSize: 7, cellPadding: 2.5, textColor: [55, 65, 81] },
      headStyles:         { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold', fontSize: 6.5, cellPadding: 3 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0:  { halign: 'center', cellWidth: 7  },
        1:  { halign: 'left',   cellWidth: 22 },
        2:  { halign: 'left'                  },
        3:  { halign: 'center', cellWidth: 22 },
        4:  { halign: 'center', cellWidth: 14 },
        5:  { halign: 'right',  cellWidth: 20 },
        6:  { halign: 'right',  cellWidth: 26 },
        7:  { halign: 'right',  cellWidth: 28, fontStyle: 'bold', textColor: [17, 24, 39] },
        8:  { halign: 'right',  cellWidth: 22 },
        9:  { halign: 'center', cellWidth: 18 },
      },
      tableWidth: W - M * 2,
      margin: { left: M, right: M },
    });

    const cy = doc.lastAutoTable.finalY + 6;

    // Total valor
    doc.setFillColor(17, 24, 39);
    doc.roundedRect(W - M - 80, cy, 80, 11, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(255);
    doc.text('Valor Total Inventario', W - M - 44, cy + 6.8, { align: 'right' });
    doc.text(fmt(totalValor), W - M - 2, cy + 6.8, { align: 'right' });

    // Footer
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.3);
    doc.line(M, pageH - 18, W - M, pageH - 18);
    doc.addImage(logoBase64, 'PNG', M, pageH - 16, 12, 12);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(17, 24, 39);
    doc.text('Pinturas Industriales Del Caribe', M + 15, pageH - 10);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(107, 114, 128);
    doc.text(`${EMPRESA.email} · ${EMPRESA.celular}`, M + 15, pageH - 6);
    doc.setTextColor(209, 213, 219);
    doc.text(`Generado el ${fecha}`, W - M, pageH - 10, { align: 'right' });
    doc.text('Barranquilla, Atlántico / Colombia', W - M, pageH - 6, { align: 'right' });

    const fechaFile = new Date().toISOString().split('T')[0];
    doc.save(`inventario_${tipoLabel.toLowerCase().replace(/ /g, '_')}_${fechaFile}.pdf`);
    toast.success(`${items.length} registros exportados a PDF`);
  } catch (e) {
    console.error(e);
    toast.error('Error al generar el PDF');
  }
};

// ── Página principal ──────────────────────────────────────────────────────────

const InventarioGlobalPage = () => {
  const [tipoActivo, setTipoActivo] = useState(null);
  const [busqueda,   setBusqueda]   = useState('');
  const [soloStock,  setSoloStock]  = useState(false);

  const { items, isLoading, isError, refetch, totalValor, totalItems, sinStock, stockCritico } =
    useInventarioGlobal(tipoActivo);

  const filtrados = items.filter((i) => {
    if (soloStock && i.stock_total === 0) return false;
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return i.nombre.toLowerCase().includes(q) || (i.codigo ?? '').toLowerCase().includes(q);
  });

  const tipoLabel = TIPO_TABS.find((t) => t.tipo === tipoActivo)?.label ?? 'Todos';

  return (
    <div className="flex flex-col w-full gap-5">

      {/* Header */}
      <HeaderSection
        title="Inventario"
        subtitle="Stock consolidado de toda la empresa"
        icon={Boxes}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition"
            >
              <RefreshCw size={13} /> Actualizar
            </button>
            <button
              onClick={() => exportarExcel(filtrados, tipoLabel)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-emerald-700 border border-emerald-200 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition"
            >
              <FileSpreadsheet size={13} /> Excel
            </button>
            <button
              onClick={() => exportarPdf(filtrados, tipoLabel)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-700 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition"
            >
              <FileText size={13} /> PDF
            </button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard label="Ítems en catálogo" value={totalItems}      icon={Package}       color="gray"  />
        <SummaryCard label="Sin stock"          value={sinStock}        icon={Package}       color="gray"  />
        <SummaryCard label="Stock crítico"      value={stockCritico}    icon={AlertTriangle} color={stockCritico > 0 ? 'red' : 'gray'} />
        <SummaryCard label="Valor inventario"   value={fmt(totalValor)} icon={DollarSign}    color="green" />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm">

        {/* Tabs tipo */}
        <div className="flex items-center border-b border-zinc-100 px-4">
          {TIPO_TABS.map((tab) => (
            <button
              key={String(tab.tipo)}
              onClick={() => setTipoActivo(tab.tipo)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tipoActivo === tab.tipo
                  ? 'border-zinc-800 text-zinc-800'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Barra de búsqueda + toggles */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar ítem o código…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full text-sm pl-8 pr-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200 transition"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={soloStock}
              onChange={(e) => setSoloStock(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 accent-zinc-800"
            />
            Solo con stock
          </label>
          <span className="ml-auto text-xs text-zinc-400">
            {filtrados.length} ítem{filtrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Tabla */}
        {isLoading ? (
          <div className="py-16"><FullPageLoader message="Cargando inventario" /></div>
        ) : isError ? (
          <div className="text-center py-16 text-red-500 text-sm">Error al cargar el inventario.</div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-3">
            <Boxes size={36} className="text-zinc-200" />
            <p className="text-sm">No hay ítems que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100 text-xs text-zinc-400 uppercase tracking-wider">
                  <th className="pl-4 pr-2 py-3 w-8" />
                  <th className="px-2 py-3 w-10 text-center">#</th>
                  <th className="px-3 py-3">Ítem</th>
                  <th className="px-3 py-3">Tipo</th>
                  <th className="px-3 py-3 text-right">Stock Total</th>
                  <th className="px-3 py-3 text-center">Ubicación</th>
                  <th className="px-3 py-3 text-right">Costo Prom.</th>
                  <th className="px-3 py-3 text-right">Valor Inventario</th>
                  <th className="px-3 py-3 text-right">Consumo 30d</th>
                  <th className="px-3 py-3 text-center">Días Restantes</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((item, index) => (
                  <ItemRow key={item.id_item_general} item={item} index={index} />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-zinc-200 bg-zinc-50 text-sm font-semibold text-zinc-700">
                  <td colSpan={7} className="px-3 py-3 text-right text-zinc-500">
                    Valor total ({filtrados.length} ítems):
                  </td>
                  <td className="px-3 py-3 text-right text-zinc-900">
                    {fmt(filtrados.reduce((s, i) => s + i.valor_inventario, 0))}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-400 text-right pb-2">
        Stock en unidad base · Días restantes calculados sobre consumo promedio de los últimos 30 días de producción
      </p>
    </div>
  );
};

export default InventarioGlobalPage;
