import { useState } from "react";
import DataTable from "./Components/DataTable"
import { 
  RefreshCw, 
  Plus, 
  Layers,
  Package,
  FlaskConical,
  Puzzle,
  Filter,
  Download,
  FileUp
} from 'lucide-react';
import { useBodegas } from "./api/useBodegas";
import { Button } from "../../shared/Button";

const InventarioPage = () => {

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { items } = useBodegas();

    console.log(items);

    return (
        <div className="flex flex-col w-full">
            {/* TOOLBAR (Pestañas y Botón Principal) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                
                {/* Pestañas de Navegación (Estilo Control Segmentado) */}
                <div className="flex items-center bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-x-auto hide-scrollbar">
                <button className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-semibold shadow-sm transition-all whitespace-nowrap">
                    <Layers size={16} className="text-zinc-500" />
                    TODOS
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-zinc-900 rounded-lg text-sm font-semibold transition-all whitespace-nowrap">
                    <Package size={16} />
                    PRODUCTOS
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-zinc-900 rounded-lg text-sm font-semibold transition-all whitespace-nowrap">
                    <FlaskConical size={16} />
                    MATERIA PRIMA
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-zinc-900 rounded-lg text-sm font-semibold transition-all whitespace-nowrap">
                    <Puzzle size={16} />
                    INSUMOS
                </button>
                </div>

                <div className="flex items-center gap-2">
                {/* Botón de Acción Secundaria (Procesar Factura) */}
                <button className="flex items-center justify-center w-10 h-10 bg-white border border-zinc-200/80 rounded-xl text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm transition-all active:scale-95" title="Filtros avanzados">
                    <RefreshCw size={18} />
                </button>

                {/* Botón de Filtros Complejos (w-10 h-10) */}
                <button className="flex items-center justify-center w-10 h-10 bg-white border border-zinc-200/80 rounded-xl text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm transition-all active:scale-95" title="Filtros avanzados">
                    <Filter size={18} />
                </button>

                {/* Botón de Exportar (w-10 h-10) */}
                <button className="flex items-center justify-center w-10 h-10 bg-white border border-zinc-200/80 rounded-xl text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm transition-all active:scale-95" title="Exportar datos">
                    <Download size={18} />
                </button>

                {/* Botón de Acción Secundaria (Procesar Factura) */}
                <button className="flex items-center justify-center w-10 h-10 text-green-600 hover:text-white bg-green-200 hover:bg-green-600 border border-zinc-200/80 rounded-xl shadow-sm transition-all active:scale-95" title="Importar Excel">
                    <FileUp size={18} />
                </button>

                {/* Botón Principal */}
                <Button
                    onClick={() => setIsDrawerOpen(true)}
                    variant="black"
                    icon={Plus}
                    sizeIcon={18}
                >
                    Agregar Producto
                </Button>
                </div>
            </div>

            <DataTable 
                isDrawerOpen={isDrawerOpen} 
                items={items} 
                setIsDrawerOpen={setIsDrawerOpen} 
            />
            
        </div>
    )
}

export default InventarioPage;