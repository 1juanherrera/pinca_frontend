import { useEffect, useState } from 'react';
import { useCostosItem } from '../../hooks/useCostosItem';
import { X, Pencil, Save, Loader2, AlertCircle } from 'lucide-react'; // Iconos Lucide
import { InputMoneda } from '../InputMoneda';

export const FormCostProducts = ({ onClose, idEdit, name, setShowForm, productDetail, eventToast }) => {

    const { updateItem, updateError, isUpdating } = useCostosItem();

    const inputClasses = "w-full bg-white text-sm px-3 py-[8px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out placeholder-gray-300 text-gray-800 shadow-sm";
    const labelClasses = "block text-[10px] font-black text-zinc-500 mb-1 uppercase tracking-widest";
    
    const [formData, setFormData] = useState({
        envase: "",
        etiqueta: "",
        bandeja: "",
        plastico: "",
        costo_mp_galon: "",
        costo_mg_kg: "",
        costo_mod: ""
    });

    useEffect(() => {
        if (productDetail?.costos) {
            setFormData(prev => ({
                ...prev,
                [name]: productDetail.costos[name] || ""
            }));
        }
    }, [productDetail, name]);

    if (!productDetail) return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl flex items-center gap-3 shadow-xl">
                <Loader2 className="animate-spin text-blue-500" />
                <span className="text-sm font-bold text-zinc-600 uppercase">Cargando parámetros...</span>
            </div>
        </div>
    );

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const dataToSend = { [name]: formData[name] };

        updateItem({ id: idEdit, data: dataToSend }, {
            onSuccess: () => {
                setShowForm(false);
                eventToast("Costo actualizado exitosamente", "success");
                onClose();
            }
        });
    }

    function removeUnderscores(texto) {
        return texto ? texto.replace(/_/g, ' ') : "";
    }

    return (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border border-zinc-200">
                
                {/* Header (Mantenemos tu Blue-500 original) */}
                <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Pencil size={18} />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-tight">
                            Editar {removeUnderscores(name)}
                        </h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="hover:bg-white/20 transition-colors rounded-full p-1.5"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Formulario */}
                <form className="p-6 space-y-5" onSubmit={handleSubmit}>
                    
                    {updateError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                            <AlertCircle size={18} className="text-red-500 shrink-0" />
                            <p className="text-red-600 text-[11px] font-bold uppercase leading-tight">
                                {updateError?.message || "Error al actualizar el parámetro"}
                            </p>
                        </div>
                    )}

                    <div className="animate-in slide-in-from-bottom-2 duration-300">
                        <InputMoneda
                            label={`Nuevo valor de mercado`}
                            name={name}
                            value={formData[name]}
                            onChange={(e) => setFormData(prev => ({ ...prev, [name]: e.target.value }))}
                            labelClasses={labelClasses}
                            className={inputClasses}
                        />
                        <p className="mt-2 text-[10px] text-zinc-400 font-medium italic">
                            * El cambio afectará los cálculos de rentabilidad de este producto.
                        </p>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex justify-end gap-3 pt-5 border-t border-zinc-100">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-4 py-2 text-[11px] font-black uppercase text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-lg transition-all"
                        >
                            Descartar
                        </button>
                        <button 
                            type="submit" 
                            disabled={isUpdating}
                            className={`flex items-center gap-2 px-6 py-2 text-[11px] font-black uppercase text-white rounded-lg transition-all shadow-md active:scale-95
                                ${isUpdating ? 'bg-zinc-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Save size={14} /> Guardar Cambios
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}