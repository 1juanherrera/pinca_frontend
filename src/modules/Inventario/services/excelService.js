import * as XLSX from 'xlsx';

export const handleExport = (data, closeModal, ) => {
  if (!data?.inventario || data.inventario.length === 0) return;

  // 1. Extraemos dinámicamente todas las propiedades (keys) del primer item
  // Esto crea los encabezados automáticamente basado en lo que mande el API
  const dataToExport = data.inventario.map(item => {
    const formattedItem = {};
    
    Object.keys(item).forEach(key => {
      // Formateamos el nombre de la columna (ej: id_item_general -> ID ITEM GENERAL)
      const friendlyKey = key.replace(/_/g, ' ').toUpperCase();
      
      let value = item[key];

      // Lógica dinámica para formatear valores conocidos
      if (!isNaN(value) && value !== null && value !== '') {
        // Si parece un número (como cantidad o precio), lo convertimos
        if (key.includes('precio') || key.includes('costo') || key.includes('cantidad')) {
            value = parseFloat(value);
        }
      }
      
      // Mapeo especial para el 'tipo' si existe
      if (key === 'tipo') {
        value = value === '0' ? 'PRODUCTO' : value === '1' ? 'MATERIA PRIMA' : 'INSUMO';
      }

      formattedItem[friendlyKey] = value ?? '-';
    });
    
    return formattedItem;
  });

  // 2. Generar Excel
  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();

  // 3. Auto-ajuste de ancho de columnas (Cálculo dinámico)
  // Buscamos el string más largo en cada columna para que quepa bien
  const objectMaxLength = []; 
  dataToExport.forEach((row) => {
    Object.values(row).forEach((val, i) => {
      const colWidth = val ? val.toString().length : 10;
      objectMaxLength[i] = Math.max(objectMaxLength[i] || 0, colWidth);
    });
  });
  ws['!cols'] = objectMaxLength.map(width => ({ wch: width + 2 }));

  XLSX.utils.book_append_sheet(wb, ws, "Datos");

  // 4. Nombre dinámico
  const timestamp = new Date().toISOString().split('T')[0];
  const safeName = data.nombre?.trim().replace(/\s+/g, '_') || 'Export';
  
  XLSX.writeFile(wb, `${safeName}_${timestamp}.xlsx`);
  closeModal();
};

const tipos = {
  '0': {
    nombre: 'PRODUCTOS',
    color: ' bg-blue-100 text-blue-700 border-blue-300'
  },
  '1': {
    nombre: 'MATERIA PRIMA',
    color: 'bg-purple-100 text-purple-600 border-purple-300'
  },
  '2': {
    nombre: 'INSUMOS',
    color: 'bg-yellow-100 text-yellow-600 border-yellow-300'
  }
};

export const getTipoInfo = (value) => {
  return tipos[value] || {
    nombre: 'TODOS LOS ITEMS',
    color: 'bg-gray-200 text-gray-700 border-gray-300'
  };
};