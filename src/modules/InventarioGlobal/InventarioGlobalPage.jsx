import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import {
  ChevronDown, ChevronRight, ChevronLeft, RefreshCw, AlertTriangle,
  Package, DollarSign, FileSpreadsheet, FileText, Boxes, Search, Wrench,
} from 'lucide-react';
import { useInventarioGlobal } from './api/useInventarioGlobal';
import { useInventario } from '../Inventario/api/useInventario';
import { useBoundStore } from '../../store/useBoundStore';
import AjusteModal from '../Inventario/Components/AjusteModal';
import HeaderSection from '../../shared/HeaderSection';
import PageTabs from '../../shared/PageTabs';
import { FullPageLoader } from '../../shared/Loader';
import FlowCard from '../../shared/FlowCard';
import StatusBadge from '../../shared/StatusBadge';
import { fmt } from '../../utils/formatters';
import { getPaginationRange } from '../Inventario/services/pagination';
import { useConfigValue } from '../Configuracion/api/useConfiguracion';
import { useEmpresaInfo } from '../../utils/empresaInfo';
import { useEmpresaLogoBase64 } from '../Configuracion/api/useEmpresa';
import cn from '../../utils/cn';
import logoFallback from '../../assets/pincaicono.png';

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

const TIPO_TONE  = { 0: 'info', 1: 'warning', 2: 'neutral' };
const TIPO_LABEL = { 0: 'Producto', 1: 'Materia Prima', 2: 'Insumo' };

const fmtNum = (n, dec = 2) =>
  new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: dec }).format(n ?? 0);

// ── Semáforo ──────────────────────────────────────────────────────────────────

const DiasRestantes = ({ dias }) => {
  const criticoDias = useConfigValue('stock_critico_dias', 10);
  const warningDias = useConfigValue('stock_warning_dias', 30);

  if (dias === null)      return <StatusBadge tone="neutral" label="Sin datos"          dot={false} size="sm" fixedWidth />;
  if (dias < criticoDias) return <StatusBadge tone="danger"  label={`${dias}d crítico`} dot={false} size="sm" fixedWidth />;
  if (dias < warningDias) return <StatusBadge tone="warning" label={`${dias}d`}         dot={false} size="sm" fixedWidth />;
  return                         <StatusBadge tone="success" label={`${dias}d`}         dot={false} size="sm" fixedWidth />;
};

// ── Fila expandible ───────────────────────────────────────────────────────────

const ItemRow = ({ item, index, onAjustar }) => {
  const [open, setOpen] = useState(false);
  const hasBodegas = item.stock_por_bodega.length > 0;
  const sinStock   = item.stock_total === 0;

  return (
    <>
      <tr
        onClick={() => hasBodegas && setOpen((o) => !o)}
        className={`
          border-b border-border-subtle text-sm transition-colors
          ${open ? 'bg-surface-muted' : index % 2 === 0 ? 'bg-surface-base' : 'bg-surface-subtle'}
          ${hasBodegas ? 'cursor-pointer hover:bg-surface-muted' : 'hover:bg-surface-subtle'}
        `}
      >
        {/* Expand */}
        <td className="pl-4 pr-2 py-2 w-8">
          {hasBodegas
            ? (open
                ? <ChevronDown size={14} className="text-brand-primary" />
                : <ChevronRight size={14} className="text-content-muted" />)
            : null}
        </td>

        {/* # */}
        <td className="px-2 py-2 text-xs text-content-muted tabular-nums w-10 text-center">
          {index + 1}
        </td>

        {/* Ítem */}
        <td className="px-3 py-2 min-w-[200px]">
          <p className="font-semibold text-content-primary">{item.nombre}</p>
          <p className="text-content-tertiary text-xs mt-0.5 font-mono">{item.codigo}</p>
        </td>

        {/* Tipo */}
        <td className="px-3 py-2">
          <StatusBadge
            tone={TIPO_TONE[item.tipo] ?? 'neutral'}
            label={TIPO_LABEL[item.tipo] ?? '—'}
            dot={false}
            size="sm"
            fixedWidth
          />
        </td>

        {/* Stock */}
        <td className="px-3 py-2 text-right tabular-nums">
          {sinStock ? (
            <span className="text-content-muted text-xs italic">Sin stock</span>
          ) : (
            <span>
              <span className="font-bold text-content-primary">{fmtNum(item.stock_total)}</span>
              <span className="text-content-tertiary text-xs ml-1">{item.unidad_base}</span>
            </span>
          )}
        </td>

        {/* Bodegas */}
        <td className="px-3 py-2 text-center">
          {item.bodegas_con_stock > 0 ? (
            <StatusBadge
              tone="neutral"
              label={`${item.bodegas_con_stock} ${item.bodegas_con_stock === 1 ? 'bodega' : 'bodegas'}`}
              dot={false}
              size="sm"
              fixedWidth
            />
          ) : (
            <span className="text-content-muted text-xs">—</span>
          )}
        </td>

        {/* Costo promedio */}
        <td className="px-3 py-2 text-right tabular-nums">
          {item.costo_promedio > 0 ? (
            <span>
              <span className="font-medium text-content-primary">{fmt(item.costo_promedio)}</span>
              <span className="text-content-tertiary text-xs ml-1">/{item.unidad_base}</span>
            </span>
          ) : (
            <span className="text-content-muted text-xs">—</span>
          )}
        </td>

        {/* Valor inventario */}
        <td className="px-3 py-2 text-right tabular-nums">
          {item.valor_inventario > 0 ? (
            <span className="font-bold text-content-primary">{fmt(item.valor_inventario)}</span>
          ) : (
            <span className="text-content-muted text-xs">—</span>
          )}
        </td>

        {/* Consumo 30d */}
        <td className="px-3 py-2 text-right tabular-nums text-content-secondary text-sm">
          {item.consumo_30_dias
            ? <span>{fmtNum(item.consumo_30_dias, 1)} <span className="text-content-tertiary text-xs">{item.unidad_base}</span></span>
            : <span className="text-content-muted text-xs">—</span>}
        </td>

        {/* Días restantes */}
        <td className="px-3 py-2 text-center">
          <DiasRestantes dias={item.dias_restantes} />
        </td>
      </tr>

      {/* Desglose bodegas */}
      {open && (
        <tr className="border-b border-border-subtle bg-surface-subtle border-l-4 border-l-brand-primary">
          <td colSpan={10} className="px-10 py-4">
            <p className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-3">
              Stock por bodega
            </p>
            <div className="flex flex-wrap gap-2">
              {item.stock_por_bodega.map((b) => (
                <div
                  key={b.bodega_id}
                  className="group relative bg-surface-base border border-brand-primary/15 rounded-xl px-4 py-3 min-w-40 shadow-sm"
                >
                  <p className="font-semibold text-content-primary text-sm pr-7">{b.bodega}</p>
                  {b.instalacion && (
                    <p className="text-content-tertiary text-xs mt-0.5">{b.instalacion}</p>
                  )}
                  <p className="font-bold text-content-primary mt-2 text-base tabular-nums">
                    {fmtNum(b.cantidad)}{' '}
                    <span className="font-normal text-content-tertiary text-sm">{item.unidad_base}</span>
                  </p>
                  {b.cantidad > 0 && onAjustar && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onAjustar(item, b); }}
                      title="Ajuste manual (rotura, derrame, conteo)"
                      className="absolute top-2 right-2 inline-flex items-center justify-center w-6 h-6 rounded-md bg-semantic-warning-subtle border border-semantic-warning/30 text-semantic-warning-fg hover:bg-semantic-warning hover:text-white hover:border-semantic-warning transition-all"
                    >
                      <Wrench size={11} />
                    </button>
                  )}
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

const exportarPdf = async (items, tipoLabel, criticoDias = 10, empresa = EMPRESA, logoB64 = null) => {
  const EMP = empresa;
  if (!items.length) { toast.error('No hay datos para exportar'); return; }

  try {
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;
    const logoBase64 = logoB64
      ?? await fetch(logoFallback).then((r) => r.blob()).then(
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
    doc.text(EMP.nombre, 37, 14);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(107, 114, 128);
    doc.text(`${EMP.nit} · ${EMP.telefono}`, 37, 19);
    doc.text(`${EMP.direccion} · ${EMP.ciudad}`, 37, 23.5);
    doc.text(EMP.web, 37, 28);

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
    const criticos   = items.filter((i) => i.dias_restantes !== null && i.dias_restantes < criticoDias).length;

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
    doc.text(`${EMP.email} · ${EMP.celular}`, M + 15, pageH - 6);
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

const InventarioGlobalPage = ({ embedded = false }) => {
  const [tipoActivo,  setTipoActivo]  = useState(null);
  const [busqueda,    setBusqueda]    = useState('');
  const [soloStock,   setSoloStock]   = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage,     setPerPage]     = useState(20);
  const [ajusteData,  setAjusteData]  = useState(null); // { item, bodega }

  const { items, isLoading, isError, refetch, totalValor, totalItems, sinStock, stockCritico } =
    useInventarioGlobal(tipoActivo);
  const { ajusteManualAsync, isAjustando } = useInventario();
  const user = useBoundStore((s) => s.user);
  // El visor recibe 403 en ajuste-manual; ocultamos el botón de ajuste.
  const puedeEditarStock = user?.rol !== 'visor';
  const criticoDias = useConfigValue('stock_critico_dias', 10);
  const empresaInfo = useEmpresaInfo();
  const { data: logoB64Data } = useEmpresaLogoBase64();

  const filtrados = useMemo(() => items.filter((i) => {
    if (soloStock && i.stock_total === 0) return false;
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return i.nombre.toLowerCase().includes(q) || (i.codigo ?? '').toLowerCase().includes(q);
  }), [items, soloStock, busqueda]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / perPage));
  // Clamp página actual dentro de rango (cuando cambian filtros el total puede bajar)
  const safePage = Math.min(currentPage, totalPages);
  const paginados  = useMemo(
    () => filtrados.slice((safePage - 1) * perPage, safePage * perPage),
    [filtrados, safePage, perPage],
  );

  const tipoLabel = TIPO_TABS.find((t) => t.tipo === tipoActivo)?.label ?? 'Todos';

  return (
    <div className="flex flex-col w-full gap-5">

      {/* Header — oculto en modo embebido */}
      {!embedded && (
        <HeaderSection
          title="Inventario"
          subtitle="Stock consolidado de toda la empresa"
          icon={Boxes}
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={refetch}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-content-secondary border border-border-base rounded-lg hover:bg-surface-subtle transition"
              >
                <RefreshCw size={13} /> Actualizar
              </button>
              <button
                onClick={() => exportarExcel(filtrados, tipoLabel)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-semantic-success-fg border border-semantic-success/20 bg-semantic-success-subtle rounded-lg hover:bg-semantic-success-subtle transition"
              >
                <FileSpreadsheet size={13} /> Excel
              </button>
              <button
                onClick={() => exportarPdf(filtrados, tipoLabel, criticoDias, empresaInfo, logoB64Data?.logo)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-semantic-danger-fg border border-semantic-danger/20 bg-semantic-danger-subtle rounded-lg hover:bg-semantic-danger-subtle transition"
              >
                <FileText size={13} /> PDF
              </button>
            </div>
          }
        />
      )}

      {embedded && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-content-secondary border border-border-base rounded-lg hover:bg-surface-subtle transition"
          >
            <RefreshCw size={13} /> Actualizar
          </button>
          <button
            onClick={() => exportarExcel(filtrados, tipoLabel)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-semantic-success-fg border border-semantic-success/20 bg-semantic-success-subtle rounded-lg hover:bg-semantic-success-subtle transition"
          >
            <FileSpreadsheet size={13} /> Excel
          </button>
          <button
            onClick={() => exportarPdf(filtrados, tipoLabel, criticoDias, empresaInfo, logoB64Data?.logo)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-semantic-danger-fg border border-semantic-danger/20 bg-semantic-danger-subtle rounded-lg hover:bg-semantic-danger-subtle transition"
          >
            <FileText size={13} /> PDF
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <FlowCard label="Ítems en catálogo" value={totalItems}      icon={Package}       tone="neutral" />
        <FlowCard label="Sin stock"          value={sinStock}        icon={Package}       tone="neutral" />
        <FlowCard label="Stock crítico"      value={stockCritico}    icon={AlertTriangle} tone={stockCritico > 0 ? 'danger' : 'neutral'} />
        <FlowCard label="Valor inventario"   value={fmt(totalValor)} icon={DollarSign}    tone="success" />
      </div>

      {/* Filtros */}
      <div className="bg-surface-base rounded-2xl border border-border-subtle shadow-sm">

        {/* Tabs tipo */}
        <div className="px-4 pt-2">
          <PageTabs
            tabs={TIPO_TABS.map((t) => ({ key: String(t.tipo), label: t.label }))}
            value={String(tipoActivo)}
            onChange={(k) => setTipoActivo(k === 'null' ? null : Number(k))}
            size="lg"
          />
        </div>

        {/* Barra de búsqueda + toggles */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
            <input
              type="text"
              placeholder="Buscar ítem o código…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full text-sm pl-8 pr-3 py-2 border border-border-base rounded-lg focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-base transition"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-content-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={soloStock}
              onChange={(e) => setSoloStock(e.target.checked)}
              className="w-4 h-4 rounded border-border-strong accent-content-primary"
            />
            Solo con stock
          </label>
          <span className="ml-auto text-xs text-content-muted">
            {filtrados.length} ítem{filtrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Tabla */}
        {isLoading ? (
          <div className="py-16"><FullPageLoader message="Cargando inventario" /></div>
        ) : isError ? (
          <div className="text-center py-16 text-semantic-danger text-sm">Error al cargar el inventario.</div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-content-muted gap-3">
            <Boxes size={36} className="text-content-muted" />
            <p className="text-sm">No hay ítems que coincidan con los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle text-xs text-content-muted uppercase tracking-wider">
                  <th className="pl-4 pr-2 py-3 w-8" />
                  <th className="px-2 py-3 w-10 text-center">#</th>
                  <th className="px-3 py-2">Ítem</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2 text-right">Stock Total</th>
                  <th className="px-3 py-2 text-center">Ubicación</th>
                  <th className="px-3 py-2 text-right">Costo Prom.</th>
                  <th className="px-3 py-2 text-right">Valor Inventario</th>
                  <th className="px-3 py-2 text-right">Consumo 30d</th>
                  <th className="px-3 py-2 text-center">Días Restantes</th>
                </tr>
              </thead>
              <tbody>
                {paginados.map((item, index) => (
                  <ItemRow
                    key={item.id_item_general}
                    item={item}
                    index={(safePage - 1) * perPage + index}
                    onAjustar={puedeEditarStock ? (it, bodega) => setAjusteData({ item: it, bodega }) : undefined}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border-base bg-surface-subtle text-sm font-semibold text-content-secondary">
                  <td colSpan={7} className="px-3 py-2 text-right text-content-tertiary">
                    Valor total ({filtrados.length} ítems):
                  </td>
                  <td className="px-3 py-2 text-right text-content-primary">
                    {fmt(filtrados.reduce((s, i) => s + i.valor_inventario, 0))}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>

            {/* Paginación — mismo estilo que la tabla de inventario por bodega */}
            <div className="px-3 py-2 bg-surface-subtle border-t border-border-base flex items-center justify-between">
              <div className="hidden sm:flex items-center gap-4">
                <div className="text-xs text-content-tertiary">
                  Mostrando <span className="text-content-primary font-semibold tabular-nums">{paginados.length}</span>{' '}
                  de <span className="text-content-primary font-semibold tabular-nums">{filtrados.length}</span> ítems
                </div>
                <div className="flex items-center gap-2 border-l border-border-base pl-4">
                  <span className="text-xs text-content-tertiary">Filas:</span>
                  <select
                    value={perPage}
                    onChange={(e) => setPerPage(Number(e.target.value))}
                    className="bg-surface-base border border-border-base text-content-primary text-xs font-medium rounded-md focus:ring-2 focus:ring-border-focus/15 focus:border-border-focus block px-2 py-1 outline-none transition-colors"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={safePage === 1}
                  className="p-1.5 border border-border-base rounded-md bg-surface-base hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>

                <div className="flex items-center gap-1">
                  {getPaginationRange(safePage, totalPages).map((page, idx) => (
                    <button
                      key={idx}
                      onClick={() => typeof page === 'number' && setCurrentPage(page)}
                      disabled={page === '...'}
                      className={cn(
                        'min-w-7 h-7 flex items-center justify-center rounded-md text-[11px] font-semibold transition-colors',
                        page === safePage
                          ? 'bg-content-primary text-content-inverse'
                          : page === '...'
                            ? 'text-content-muted cursor-default'
                            : 'bg-surface-base border border-border-base text-content-secondary hover:border-border-strong hover:text-content-primary',
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={safePage >= totalPages}
                  className="p-1.5 border border-border-base rounded-md bg-surface-base hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-content-muted text-right pb-2">
        Stock en unidad base · Días restantes calculados sobre consumo promedio de los últimos 30 días de producción
      </p>

      {ajusteData && (
        <AjusteModal
          item={{
            id_item_general: ajusteData.item.id_item_general,
            nombre:          ajusteData.item.nombre,
            codigo:          ajusteData.item.codigo,
            cantidad:        ajusteData.bodega.cantidad,
            costo_unitario:  ajusteData.item.costo_promedio,
          }}
          bodegaId={ajusteData.bodega.bodega_id}
          onClose={() => setAjusteData(null)}
          onConfirm={async (payload) => {
            await ajusteManualAsync(payload);
            setAjusteData(null);
            refetch();
          }}
          isSubmitting={isAjustando}
        />
      )}
    </div>
  );
};

export default InventarioGlobalPage;
