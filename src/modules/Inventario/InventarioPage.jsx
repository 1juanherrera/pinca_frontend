import { useEffect } from "react";
import DataTable from "./Components/DataTable"
import {
  RefreshCw,
  Filter,
  Download,
  Store,
  FileCog,
  Info,
} from 'lucide-react';
import { ButtonSquare } from "../../shared/Button";
import { useParams } from "react-router";
import { useBoundStore } from "../../store/useBoundStore";
import HeaderSection from '../../shared/HeaderSection';
import { useInventario } from "./api/useInventario";

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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <HeaderSection
          title={`Existencias y Lotes${items?.nombre ? ` — ${items.nombre}` : ''}`}
          subtitle="Sedes"
          icon={Store}
          breadcrumbs={[
            { label: 'Administración' },
            { label: 'Sedes', path: '/' },
            { label: sedeName || 'Sede', path: items?.instalaciones_id ? `/instalaciones/bodegas/${items.instalaciones_id}` : '#' },
            { label: isLoadingItems ? '' : (items?.nombre || 'Bodega'), path: `/inventario/bodega/${id_bodega}` },
          ]}
        />

        <div className="flex items-center gap-2">
          <ButtonSquare icon={RefreshCw} onClick={refresh} sizeIcon={18} title="Actualizar datos" variant="white" />
          <ButtonSquare icon={Filter} sizeIcon={18} title="Filtros avanzados" variant="white" />
          <ButtonSquare icon={Download} sizeIcon={18} title="Exportar datos" variant="white" />
          <ButtonSquare icon={FileCog} sizeIcon={18} title="Importar Excel" variant="emerald" onClick={() => openModal('EXPORT_EXCEL')} />
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Info size={16} className="mt-0.5 shrink-0" />
        <span>Este módulo es de solo lectura. El stock ingresa al sistema exclusivamente a través de la recepción de Órdenes de Compra.</span>
      </div>

      <DataTable />
    </div>
  )
}

export default InventarioPage;