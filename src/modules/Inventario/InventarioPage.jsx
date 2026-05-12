import { useEffect } from 'react';
import DataTable from './Components/DataTable';
import {
  RefreshCw, Filter, Download, Store, FileCog, Info,
} from 'lucide-react';
import { ButtonSquare } from '../../shared/Button';
import { useParams } from 'react-router';
import { useBoundStore } from '../../store/useBoundStore';
import HeaderSection from '../../shared/HeaderSection';
import { useInventario } from './api/useInventario';

const InventarioPage = () => {
  const { id_bodega } = useParams();
  const { setBodega, clearBodega, sedeName } = useBoundStore();
  const { isLoadingItems, items, refresh } = useInventario(id_bodega);
  const openModal = useBoundStore(state => state.openModal);

  useEffect(() => {
    setBodega(id_bodega);
    return () => clearBodega();
  }, [id_bodega, setBodega, clearBodega]);

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <HeaderSection
          title={`Existencias y Lotes${items?.nombre ? ` — ${items.nombre}` : ''}`}
          icon={Store}
          breadcrumbs={[
            { label: 'Administración' },
            { label: 'Sedes', path: '/' },
            { label: sedeName || 'Sede', path: items?.instalaciones_id ? `/instalaciones/bodegas/${items.instalaciones_id}` : '#' },
            { label: isLoadingItems ? '' : (items?.nombre || 'Bodega'), path: `/inventario/bodega/${id_bodega}` },
          ]}
        />

        <div className="flex items-center gap-1.5">
          <ButtonSquare icon={RefreshCw} onClick={refresh} size="md" title="Actualizar datos"   variant="secondary" />
          <ButtonSquare icon={Filter}                       size="md" title="Filtros avanzados"  variant="secondary" />
          <ButtonSquare icon={Download}                     size="md" title="Exportar datos"     variant="secondary" />
          <ButtonSquare icon={FileCog}                      size="md" title="Importar Excel"     variant="primary"   onClick={() => openModal('EXPORT_EXCEL')} />
        </div>
      </div>

      {/* Banner read-only refinado */}
      <div className="flex items-start gap-2.5 rounded-xl border border-semantic-info/15 bg-semantic-info-subtle/60 px-4 py-2.5 text-xs text-semantic-info-fg">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span className="leading-relaxed">
          Este módulo es de <span className="font-semibold">solo lectura</span>. El stock ingresa al sistema exclusivamente a través de la recepción de Órdenes de Compra.
        </span>
      </div>

      <DataTable />
    </div>
  );
};

export default InventarioPage;
