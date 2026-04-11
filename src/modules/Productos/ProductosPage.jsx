import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import ProductosTable from './components/ProductosTable';
import ProductosFilters from './components/ProductosFilters';
import ProductosStats from './components/ProductosStats';
import { useProductos } from './api/useProductos';
import { useBoundStore } from '../../store/useBoundStore';
import { fmt } from '../../utils/formatters';
import logo from '../../assets/pincaicono.png';

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

const ProductosPage = () => {
  const { setActiveTitle } = useBoundStore();

  const [filters, setFilters] = useState({
    search: '', categoria: '', bodega: '', sede: '', conStock: false,
  });

  const [pagination, setPagination] = useState({ page: 1, perPage: 25 });

  const { data, allData, isLoading, error } = useProductos({ ...filters, ...pagination });

  useEffect(() => { setActiveTitle('Productos'); }, [setActiveTitle]);

  const handleSearch       = (s)  => { setFilters(p => ({ ...p, search: s }));       setPagination(p => ({ ...p, page: 1 })); };
  const handleFilterChange = (f)  => { setFilters(p => ({ ...p, ...f }));            setPagination(p => ({ ...p, page: 1 })); };

  // ── Export Excel ─────────────────────────────────────────────────────────────
  const exportToExcel = () => {
    if (!allData.length) { toast.error('No hay datos para exportar'); return; }

    const rows = allData.map(item => ({
      'Código':          item.codigo,
      'Nombre':          item.nombre,
      'Categoría':       item.categoria,
      'Unidad':          item.unidad || '—',
      'Stock Total':     item.cantidad_total,
      'Bodegas':         item.num_bodegas,
      'Costo Unitario':  item.costo_unitario ? parseFloat(item.costo_unitario.toFixed(2)) : 0,
      'Valor Total':     item.valor_total    ? parseFloat(item.valor_total.toFixed(2))    : 0,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = Object.keys(rows[0]).map(key => ({
      wch: Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length)) + 2,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    XLSX.writeFile(wb, `productos_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`${allData.length} registros exportados a Excel`);
  };

  // ── Export PDF ───────────────────────────────────────────────────────────────
  const exportToPdf = async () => {
    if (!allData.length) { toast.error('No hay datos para exportar'); return; }

    try {
      const { jsPDF }  = await import('jspdf');
      const autoTable  = (await import('jspdf-autotable')).default;
      const logoBase64 = await fetch(logo).then(r => r.blob()).then(b => new Promise(res => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.readAsDataURL(b);
      }));

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W = 297, M = 14;

      // Barra superior
      doc.setFillColor(17, 24, 39);
      doc.rect(0, 0, W, 4, 'F');

      // Logo
      doc.addImage(logoBase64, 'PNG', M, 8, 20, 20);

      // Empresa
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(17, 24, 39);
      doc.text(EMPRESA.nombre, 37, 14);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(107, 114, 128);
      doc.text(`${EMPRESA.nit} · ${EMPRESA.telefono}`, 37, 19);
      doc.text(`${EMPRESA.direccion} · ${EMPRESA.ciudad}`, 37, 23.5);
      doc.text(EMPRESA.web, 37, 28);

      // Título (derecha)
      const fecha = new Date().toLocaleDateString('es-CO');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(107, 114, 128);
      doc.text('INVENTARIO DE PRODUCTOS', W - M, 12, { align: 'right' });
      doc.setFillColor(17, 24, 39);
      doc.roundedRect(W - M - 52, 14.5, 52, 9, 2, 2, 'F');
      doc.setFontSize(9.5); doc.setTextColor(255);
      doc.text(`${allData.length} registros`, W - M - 26, 20.5, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(156, 163, 175);
      doc.text(`Generado: ${fecha}`, W - M, 27, { align: 'right' });

      // Separador
      doc.setDrawColor(229, 231, 235); doc.setLineWidth(0.4);
      doc.line(M, 33, W - M, 33);

      // Bloques de resumen
      const totalValor = allData.reduce((s, i) => s + (i.valor_total    || 0), 0);
      const totalStock = allData.reduce((s, i) => s + (i.cantidad_total || 0), 0);
      const numBodegas = [...new Set(allData.flatMap(i => i.bodegas?.map(b => b.nombre) || []))].length;

      const bloques = [
        { label: 'Total Productos',   value: allData.length.toString() },
        { label: 'Unidades en Stock', value: Number(totalStock).toLocaleString('es-CO') },
        { label: 'Bodegas',           value: numBodegas.toString() },
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
        head: [['#', 'Código', 'Nombre', 'Categoría', 'Unidad', 'Stock Total', 'Bodegas', 'Costo Unit.', 'Valor Total']],
        body: allData.map((item, i) => [
          i + 1,
          item.codigo,
          item.nombre,
          item.categoria || '—',
          item.unidad    || '—',
          Number(item.cantidad_total || 0).toLocaleString('es-CO'),
          item.num_bodegas ?? 0,
          item.costo_unitario ? fmt(item.costo_unitario) : '—',
          item.valor_total    ? fmt(item.valor_total)    : '—',
        ]),
        styles:     { fontSize: 7.5, cellPadding: 2.8, textColor: [55, 65, 81] },
        headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold', fontSize: 7, cellPadding: 3 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8  },
          1: { halign: 'left',   cellWidth: 22 },
          2: { halign: 'left'                  },
          3: { halign: 'left',   cellWidth: 28 },
          4: { halign: 'center', cellWidth: 16 },
          5: { halign: 'right',  cellWidth: 22 },
          6: { halign: 'center', cellWidth: 18 },
          7: { halign: 'right',  cellWidth: 28 },
          8: { halign: 'right',  cellWidth: 30, fontStyle: 'bold', textColor: [17, 24, 39] },
        },
        didParseCell: (data) => {
          if (data.section === 'head') {
            const aligns = ['center','left','left','left','center','right','center','right','right'];
            data.cell.styles.halign = aligns[data.column.index];
          }
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

      doc.save(`productos_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(`${allData.length} registros exportados a PDF`);
    } catch (e) {
      console.error(e);
      toast.error('Error al generar el PDF');
    }
  };

  const productos   = data?.data  || [];
  const totalItems  = data?.total || 0;
  const stats       = data?.stats || {};

  return (
    <div className="space-y-3">
      <ProductosStats
        stats={stats}
        onExportExcel={exportToExcel}
        onExportPdf={exportToPdf}
        hasData={allData.length > 0}
      />

      <ProductosFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />

      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
        <ProductosTable
          productos={productos}
          isLoading={isLoading}
          error={error}
          pagination={pagination}
          totalItems={totalItems}
          onPageChange={(page) => setPagination(p => ({ ...p, page }))}
          onPerPageChange={(perPage) => setPagination(p => ({ ...p, perPage, page: 1 }))}
        />
      </div>
    </div>
  );
};

export default ProductosPage;
