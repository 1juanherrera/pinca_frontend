import { useState } from 'react';
import { Calculator, RotateCw, FileDown, CheckSquare, Info, Stamp } from 'lucide-react';
import { formatNumber } from '../utils/handlers';
import { Button, ButtonSquare } from '../../../shared/Button';
import { useBoundStore } from '../../../store/useBoundStore';

export const CostCalculator = ({ 
    productDetail, 
    selectedProductData, 
    loadingDetail, 
    compact = false, 
    handleRecalcular, 
    setNuevoVolumen, 
    recalculatedData, 
    isRecalculating 
}) => {

    // Estado local — no sube al padre hasta confirmar
    const [inputVolumen, setInputVolumen] = useState('');
    const { openDrawer } = useBoundStore();

    const confirmar = () => {
        if (!inputVolumen || isNaN(inputVolumen) || Number(inputVolumen) <= 0) return;
        setNuevoVolumen(inputVolumen);   // sube al padre
        handleRecalcular();              // dispara el recálculo
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') confirmar();
    };

    // 1. Estado de espera
    if (!selectedProductData) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-gray-400 mb-3">
                    <Calculator size={compact ? 32 : 48} className="mx-auto" />
                </div>
                <h3 className={`${compact ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-2`}>
                    Calculadora de Costos
                </h3>
                <p className="text-sm text-gray-500">
                    Selecciona un producto para calcular costos
                </p>
            </div>
        );
    }
    
    const isProcessing = loadingDetail || isRecalculating;
    const original     = productDetail?.costos;
    const proyectado   = recalculatedData?.recalculados;

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-zinc-200/60">

            {/* Header */}
            <div className="bg-zinc-700 text-white px-4 py-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold flex items-center gap-2`}>
                            <Calculator size={compact ? 16 : 20} />
                            Calculadora de Costos
                        </h3>
                        <p className="text-zinc-100 text-xs">
                            {productDetail?.item?.nombre || selectedProductData.nombre} — {productDetail?.item?.codigo || selectedProductData.codigo}
                        </p>
                    </div>
                </div>
            </div>

            {/* Formulario */}
            <div className="p-4">
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nuevo Volumen
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={inputVolumen}
                                onChange={(e) => setInputVolumen(e.target.value)}  // solo estado local
                                onKeyDown={handleKeyDown}                           // Enter confirma
                                placeholder={productDetail?.item?.volumen_base || '0'}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                                min="0.01"
                                step="0.01"
                                disabled={isProcessing}
                            />
                            <Button
                                onClick={confirmar} 
                                disabled={isProcessing || !inputVolumen}
                                variant="zinc"
                                className="hover:bg-zinc-700 hover:scale-105 text-white px-3 py-2 cursor-pointer rounded-lg transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <RotateCw size={18} className={isRecalculating ? "animate-spin" : ""} />
                            </Button>
                        </div>

                        {/* Resultado rápido */}
                        {recalculatedData && (
                            <div className="mt-3 p-2 bg-green-100 border border-green-200 flex justify-center items-center rounded-md text-center font-semibold animate-in fade-in slide-in-from-top-1">
                                <CheckSquare size={16} className="text-green-700" />
                                <p className="text-sm ml-2 text-green-700">
                                    Costo total: $ {formatNumber(proyectado?.total_costo_materia_prima)}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Mensaje ayuda */}
                    <div className={`flex justify-center items-center py-2 bg-zinc-50 rounded-lg border border-zinc-100 ${recalculatedData ? 'hidden' : ''}`}>
                        <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-tight flex items-center gap-1">
                            <Info size={12} /> Escribe un volumen y presiona Enter o el botón
                        </p>
                    </div>
                </div>
            </div>

            {/* Resultados detallados */}
            {recalculatedData && productDetail && (
                <div className="bg-gray-50 p-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-tighter">
                            Resultados Simulación
                        </h4>
                        <div className="flex gap-2">
                            <ButtonSquare children="EXCEL" variant="emerald" icon={FileDown} />
                            <Button 
                              onClick={() => openDrawer('PREPARATION_FORM', {
                                productDetail,
                                recalculatedData 
                            })} 
                            children="PREPARAR" 
                            variant="blue" 
                            icon={Stamp} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Original */}
                        <div className="bg-white rounded-lg border-2 border-gray-200 p-3 shadow-sm">
                            <h5 className="font-bold text-gray-400 mb-2 text-[10px] uppercase tracking-widest leading-none">
                                Original ({productDetail.item?.volumen_base} G)
                            </h5>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">T/Costos:</span>
                                    <span className="font-bold text-gray-700">$ {formatNumber(original?.total_costo_materia_prima)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Cantidad:</span>
                                    <span className="font-bold text-gray-700">{original?.total_cantidad_materia_prima}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Venta C/U:</span>
                                    <span className="font-bold text-gray-700">$ {formatNumber(original?.precio_venta)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Calculado */}
                        <div className="bg-white rounded-lg p-3 border-2 border-green-200 shadow-sm">
                            <h5 className="font-bold text-green-700 mb-2 text-[10px] uppercase tracking-widest leading-none">
                                Nuevo ({recalculatedData?.item?.volumen_nuevo} G)
                            </h5>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-green-600 font-medium">T/Costos:</span>
                                    <span className="font-bold text-green-700">$ {formatNumber(proyectado?.total_costo_materia_prima)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-600 font-medium">Cantidad:</span>
                                    <span className="font-bold text-green-700">{proyectado?.total_cantidad_materia_prima}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-600 font-medium">Venta C/U:</span>
                                    <span className="font-bold text-green-700">$ {formatNumber(proyectado?.precio_venta)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-2 bg-zinc-100 border border-zinc-200 rounded-lg flex justify-between text-[9px] font-black text-zinc-800 uppercase tracking-tight">
                        <p>Factor de Volumen: x{recalculatedData?.item?.factor_volumen}</p>
                    </div>
                </div>
            )}
        </div>
    );
};