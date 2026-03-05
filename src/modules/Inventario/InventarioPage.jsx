import { useEffect } from "react";
import DataTable from "./Components/DataTable"
import { 
  RefreshCw, 
  Plus,
  Filter,
  Download,
  Store,
  FileCog
} from 'lucide-react';
import { Button, ButtonSquare } from "../../shared/Button";
import { useParams } from "react-router";
import { useBoundStore } from "../../store/useBoundStore";
import HeaderSection from '../../shared/HeaderSection';
import { useInventario } from "./api/useInventario";
import ItemFormModal from "./Components/ItemForm";
import { ExcelModal } from "./Components/ExcelModal";

const InventarioPage = () => {

    const { id_bodega } = useParams();
    const { setBodega, clearBodega, sedeName, openDrawer } = useBoundStore();
    const { isLoadingItems, items, refresh } = useInventario(id_bodega);
    const openModal = useBoundStore(state => state.openModal);

    useEffect(() => {
        setBodega(id_bodega);
        
        return () => clearBodega();
    }, [id_bodega, setBodega, clearBodega]);

    return (
        <div className="flex flex-col w-full">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                    <HeaderSection
                    title={`Gestión de Inventario ${items?.nombre ? ` - ${items.nombre}` : ''}`}
                    subtitle="Sedes"
                    icon={Store}
                    description="Bodegas Pinca"
                    breadcrumbs={[
                        { 
                          label: "Administración" 
                        },
                        { label: "Sedes", 
                          path: "/" 
                        },
                        { label: `${sedeName || 'Sede'}`, 
                          path: items?.instalaciones_id ? `/instalaciones/bodegas/${items.instalaciones_id}` : "#"
                        },
                        { label: `${isLoadingItems ? '' : `${items?.nombre || 'Bodega'}`}`, 
                          path: `/inventario/bodega/${id_bodega}` 
                        }
                    ]}
                    />

                    <div className="flex gap-2">
                        <ButtonSquare
                        icon={RefreshCw}
                        onClick={refresh}
                        sizeIcon={18}
                        title="Actualizar datos"
                        variant="white"
                        />
                        <ButtonSquare
                            icon={Filter}
                            sizeIcon={18}
                            title="Filtros avanzados"
                            variant="white"
                        />
                        <ButtonSquare
                            icon={Download}
                            sizeIcon={18}
                            title="Exportar datos"
                            variant="white"
                        />
                        <ButtonSquare
                            icon={FileCog}
                            sizeIcon={18}
                            title="Importar Excel"
                            variant="emerald"
                            onClick={() => {
                                openModal('EXPORT_EXCEL');
                                console.log("Modal activo actualmente:", 'EXPORT_EXCEL');
                            }}
                        />

                        <Button
                        variant="black"
                        onClick={() => openDrawer('ITEM_FORM')}
                        icon={Plus}
                        >
                        Agregar Item
                        </Button>
                    </div>
                </div>

            <DataTable />
            <ItemFormModal />
            <ExcelModal data={items} />
        </div>
    )
}

export default InventarioPage;