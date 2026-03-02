import { useEffect, useState } from "react";
import DataTable from "./Components/DataTable"
import { 
  RefreshCw, 
  Plus,
  Filter,
  Download,
  FileUp,
  Store
} from 'lucide-react';
import { Button, ButtonSquare } from "../../shared/Button";
import { useParams } from "react-router";
import { useBoundStore } from "../../store/useBoundStore";
import { useBodegas } from "../Bodegas/api/useBodegas";
import { FullPageLoader } from "../../shared/Loader";
import HeaderSection from '../../shared/HeaderSection';

const InventarioPage = () => {

    const { id_bodega } = useParams();
    const { setBodega, clearBodega } = useBoundStore();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { isLoadingItems, bodegasInstalacion, items } = useBodegas(id_bodega);

    useEffect(() => {
        setBodega(id_bodega);
        
        return () => clearBodega();
    }, [id_bodega, setBodega, clearBodega]);

    return (
        <div className="flex flex-col w-full">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
                    <HeaderSection
                    title={`Gestión de Inventario${items?.nombre ? ` - ${items.nombre}` : ''}`}
                    subtitle="Sedes"
                    icon={Store}
                    description="Bodegas Pinca"
                    breadcrumbs={[
                        { label: "Administración" },
                        { label: "Sedes", path: "/" },
                        { label: `${isLoadingItems ? '' : `${bodegasInstalacion?.nombre || 'Bodegas'}`}`, path: `/instalaciones/bodegas/${bodegasInstalacion?.id_instalaciones}` },
                        { label: `${isLoadingItems ? '' : `${items?.nombre || 'Bodega'}`}`, path: `/inventario/bodega/${id_bodega}` }
                    ]}
                    />

                    <div className="flex gap-2">
                        <ButtonSquare
                        icon={RefreshCw}
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
                            icon={FileUp}
                            sizeIcon={18}
                            title="Importar Excel"
                            variant="emerald"
                        />

                        <Button
                        variant="black"
                        onClick={() => setIsDrawerOpen(true)}
                        icon={Plus}
                        >
                        Agregar Bodega
                        </Button>
                    </div>
                </div>

            <DataTable 
                isDrawerOpen={isDrawerOpen} 
                setIsDrawerOpen={setIsDrawerOpen} 
            />
            
        </div>
    )
}

export default InventarioPage;