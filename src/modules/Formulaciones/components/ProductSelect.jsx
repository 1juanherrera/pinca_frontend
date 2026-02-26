import React from 'react';
import { 
  Beaker, 
  ChevronDown, 
  Eraser, 
  Package, 
  Search, 
} from 'lucide-react';

export const ProductSelect = ({ 
    selectedProduct = false, 
    onProductSelect, 
    onClearSelection, 
    loading = false 
}) => {

    // --- ESTADO CARGANDO COMPACTO ---
    if (loading) {
        return (
            <div className="bg-white border border-zinc-200/60 rounded-xl px-4 py-3 shadow-sm">
                <div className="animate-pulse flex flex-col gap-2">
                    <div className="h-2 bg-zinc-100 rounded-full w-1/4"></div>
                    <div className="h-8 bg-zinc-50 rounded-lg border border-zinc-100"></div>
                </div>
            </div>
        );
    }

    return (
        // REDUCCIÓN DE ESPACIO: p-5 -> px-4 py-3
        <div className="bg-white border border-zinc-200/60 rounded-xl px-4 py-3 shadow-sm transition-all hover:border-zinc-300 w-full">
            
            {/* CABECERA: mb-4 -> mb-2.5 */}
            <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                    {/* Icono más pequeño */}
                    <div className="p-1 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                        <Beaker size={14} />
                    </div>
                    {/* Fuente más pequeña: text-[10px] */}
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider leading-none">
                        Seleccionar Item
                    </h3>
                </div>

                {selectedProduct && (
                    // Botón limpiar más compacto
                    <button
                        onClick={onClearSelection}
                        className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded transition-all uppercase tracking-tight"
                    >
                        <Eraser size={11}/>
                        Limpiar
                    </button>
                )}
            </div>

            {/* CONTENEDOR DEL SELECT */}
            <div className="relative group w-full">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none group-focus-within:text-blue-500 transition-colors">
                    <Search size={14} />
                </div>
                
                <select
                    value={selectedProduct ?? ''}
                    onChange={(e) => onProductSelect(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 bg-zinc-50 border placeholder:text-red-800 border-zinc-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white appearance-none transition-all cursor-pointer truncate"
                >
                    <option value="" className="text-zinc-400">Buscar producto o insumo...</option>
                    <optgroup label="PRODUCTOS TERMINADOS">
                        <option value="1">EBT012 - VINILO T1 BLANCO</option>
                        <option value="2">ESM002 - ESMALTE BLANCO</option>
                    </optgroup>
                    <optgroup label="MATERIAS PRIMAS / INSUMOS">
                        <option value="3">MP019 - FUNGICIDA</option>
                        <option value="4">MP018 - AMONIACO</option>
                    </optgroup>
                </select>

                {/* Flecha más pequeña */}
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-zinc-400">
                    <ChevronDown size={14} />
                </div>
            </div>

            {/* INFO DEL ITEM SELECCIONADO COMPACTA: mt-4 -> mt-2.5 y p-3 -> p-2 */}
            {selectedProduct && (
                <div className="mt-2.5 flex items-center gap-2.5 p-2 bg-zinc-50/80 border border-zinc-200/80 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Icon box más pequeño */}
                    <div className="w-6 h-6 rounded-md bg-white border border-zinc-200 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                        <Package size={13} />
                    </div>
                    <div>
                        {/* Fuentes más pequeñas */}
                        <p className="text-[9px] font-bold text-zinc-400 uppercase leading-none mb-0.5">Item Seleccionado</p>
                        <p className="text-xs font-semibold text-zinc-900 tracking-tight leading-none">
                            ✓ Producto listo para formulación
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};