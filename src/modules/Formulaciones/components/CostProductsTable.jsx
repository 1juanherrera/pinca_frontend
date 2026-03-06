import { 
  Calculator, 
  FlaskConical, 
  Briefcase, 
  Box, 
  Tag, 
  Droplets, 
  DollarSign, 
  Settings, 
  Pencil 
} from 'lucide-react';
// import { FormCostProducts } from './FormCostProducts';

export const CostProductsTable = ({ 
    selectedProductData, 
    productDetail = null, 
    compact = false, 
    recalculatedData 
}) => {

    // 1. Estado de espera (Estilo Original)
    if (!selectedProductData) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-zinc-200/60">
                <div className="text-gray-400 mb-3">
                    <Calculator size={48} className="mx-auto" />
                </div>
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    Desglose de Costos
                </h3>
                <p className="text-xs text-gray-500">
                    Selecciona un producto para ver su desglose de costos
                </p>
            </div>
        )
    }

    // 🚩 MAPEADO DE CONCEPTOS CON ICONOS LUCIDE
    const COST_DEFINITIONS = {
        costo_mp_galon: { label: 'COSTO MP/GALÓN', name: 'costo_mp_galon', icon: <FlaskConical className="text-blue-500" size={14} /> },
        costo_mg_kg: { label: 'COSTO MG/KG', name: 'costo_mg_kg', icon: <FlaskConical className="text-blue-500" size={14} /> },
        costo_mod: { label: 'COSTO MOD', name: 'costo_mod', icon: <Briefcase className="text-green-500" size={14} /> },
        envase: { label: 'ENVASE', name: 'envase', icon: <Box className="text-orange-500" size={14} /> },
        etiqueta: { label: 'ETIQUETA', name: 'etiqueta', icon: <Tag className="text-red-500" size={14} /> },
        bandeja: { label: 'BANDEJA', name: 'bandeja', icon: <Tag className="text-purple-500" size={14} /> },
        plastico: { label: 'PLÁSTICO', name: 'plastico', icon: <Droplets className="text-teal-500" size={14} /> },
    }

    return (
        <>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-zinc-200/60">
            {/* Header con Degradado Emerald Original */}
            <div className="bg-zinc-700 text-white px-4 py-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold flex items-center gap-2 tracking-tight`}>
                            <Calculator size={compact ? 16 : 20} />
                            Desglose de Costos
                            {recalculatedData && (
                                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-sm ml-2">
                                    Calculado
                                </span>
                            )}
                        </h3>
                        <p className="text-emerald-50 text-xs opacity-90">
                            {productDetail?.item?.nombre || selectedProductData.nombre}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-semibold text-white uppercase italic"> 
                            Vol: {recalculatedData ? recalculatedData?.item?.volumen_nuevo : productDetail?.item?.volumen_base || 0}
                        </div>
                        <div className="text-[10px] font-semibold text-white">
                            {productDetail?.item?.codigo || selectedProductData.codigo}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla de Costos */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                Concepto
                            </th>
                            <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <DollarSign size={10} /> Valor
                                </div>
                            </th>  
                            <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <DollarSign size={10} /> Original
                                </div>
                            </th>
                            <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <Settings size={10}/> Acciones
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {productDetail?.costos &&
                            Object.entries(productDetail.costos || {})
                            .filter(([key]) => COST_DEFINITIONS[key])
                            .map(([key, value]) => {
                                const { label, icon } = COST_DEFINITIONS[key];
                                return (
                                    <tr key={key} className="hover:bg-emerald-50/30 transition-colors">
                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="shrink-0 mr-3 p-1 bg-zinc-50 rounded border border-zinc-100">
                                                    {icon}
                                                </div>
                                                <div className="text-xs font-semibold text-zinc-700 uppercase tracking-tighter">
                                                    {label}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-3 py-2 whitespace-nowrap text-center">
                                            <div className={`text-xs font-bold ${value ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                {value || '-'}
                                            </div>
                                        </td>

                                        <td className="px-3 py-2 whitespace-nowrap text-center text-xs font-semibold text-gray-400">
                                            {value || '-'}
                                        </td>

                                        <td className="px-3 py-2 whitespace-nowrap">
                                            <div className="flex justify-center">
                                                <button
                                                    className={`p-1.5 ${(label === "COSTO MP/GALÓN" || label === "COSTO MG/KG") ? 'hidden' : '' } text-white duration-200 transform hover:scale-110 rounded-md bg-zinc-400 hover:bg-zinc-800 cursor-pointer shadow-sm`}
                                                    title="Editar Parámetro"
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
              
                    {/* FOOTER DE TOTALES (Estilo Original Emerald) */}
                    <tfoot>
                        <tr className="bg-emerald-50/50 font-semibold border-t-2 border-emerald-200">
                            <td className="px-3 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="shrink-0 mr-3">
                                        <DollarSign className="text-emerald-600" size={16} />
                                    </div>
                                    <div className="text-xs font-bold text-zinc-800 uppercase">
                                        COSTO TOTAL
                                    </div>
                                </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-center">
                                <div className="text-lg font-bold text-emerald-700 tracking-tighter">
                                    $ {productDetail?.costos?.total || 0}
                                </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-center">
                                <div className="text-xs font-semibold text-zinc-400">
                                    {recalculatedData?.recalculados?.total || "-"}
                                </div>
                            </td>
                            <td></td>
                        </tr>
                        <tr className="bg-zinc-900 font-semibold text-white">
                            <td className="px-3 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="shrink-0 mr-3">
                                        <DollarSign className="text-white" size={16} />
                                    </div>
                                    <div className="text-xs font-bold uppercase">
                                        VENTA SUGERIDA <span className="ml-1 bg-white text-zinc-900 px-1.5 py-0.5 rounded text-[9px]">50%</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-center">
                                <div className="text-lg font-bold tracking-tighter">
                                    $ {productDetail?.costos?.precio_venta || "-"}
                                </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-center text-xs opacity-70">
                                {recalculatedData?.recalculados?.precio_venta || "-"}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer de Fecha */}
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 flex justify-between items-center text-[9px] font-semibold text-gray-400 uppercase">
                <div>Pinca S.A.S — División de Costos</div>
                <div>Calculado: {productDetail?.costos?.fecha_calculo || 'N/A'}</div>
            </div>
        </div>

        {/* Modales y Notificaciones */}
        {/* {showForm && (
            <FormCostProducts
                idEdit={idEdit}
                setShowForm={setShowForm}
                name={name}
                eventToast={eventToast}
                productDetail={productDetail}
                onClose={() => {
                    setIdEdit(null);
                    setShowForm(false);
                }}
            />
        )} */}
        </>
    )
}