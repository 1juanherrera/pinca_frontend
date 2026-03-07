import { 
  Beaker, 
  FlaskConical, 
  Palette, 
  Clock, 
  Eye, 
  Droplets, 
  Weight, 
  Paintbrush,
  Activity
} from 'lucide-react';

export const ProductSpecificationsTable = ({ 
    selectedProductData, 
    productDetail 
}) => {

    // 1. Estado de espera (Estilo Original)
    if (!selectedProductData) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-zinc-200/60">
                <div className="text-gray-400 mb-3">
                    <Beaker size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Especificaciones Técnicas
                </h3>
                <p className="text-xs text-gray-500">
                    Selecciona un producto para ver sus especificaciones
                </p>
            </div>
        );
    }

    // 🚩 MAPEADO DE PARAMETROS CON ICONOS LUCIDE
    const PARAMETER_DEFINITIONS = {
        viscosidad: {
            label: 'VISCOSIDAD',
            icon: <Droplets className="text-blue-500" size={14} />,
            format: (v) => v || '-'
        },
        p_g: {
            label: 'P / G',
            icon: <Weight className="text-green-500" size={14} />,
            format: (v) => v || '-'
        },
        brillo: {
            label: 'BRILLO',
            icon: <Eye className="text-yellow-500" size={14} />,
            format: (v) => (v === 'MATE' ? 'MATE' : v || '-')
        },
        brillo_60: {
            label: 'BRILLO 60°',
            icon: <Eye className="text-yellow-500" size={14} />,
            format: (v) => v || '-'
        },
        molienda: {
            label: 'MOLIENDA',
            icon: <Eye className="text-purple-500" size={14} />,
            format: (v) => (v ? `${v} H` : '-')
        },
        secado: {
            label: 'SECADO',
            icon: <Clock className="text-orange-500" size={14} />,
            format: (v) => v || '-'
        },
        cubrimiento: {
            label: 'CUBRIMIENTO',
            icon: <Paintbrush className="text-indigo-500" size={14} />,
            format: (v) => v || '-'
        },
        color: {
            label: 'COLOR',
            icon: <Palette className="text-red-500" size={14} />,
            format: (v) => (v === 'STD' ? 'STD' : v || '-')
        },
        ph: {
            label: 'PH',
            icon: <Activity className="text-teal-500" size={14} />,
            format: (v) => (v === 0 ? '-' : v || '-')
        },
        poder_tintoreo: {
            label: 'PODER TINTÓREO',
            icon: <Palette className="text-pink-500" size={14} />,
            format: (v) => (v === 'STD' ? 'STD' : v || '-')
        },
    };

    const formatValue = (param, value) => {
        if (!value || value === 0 || value === '0') return '-';
        switch(param.toLowerCase()) {
            case 'molienda': return `${value} H`;
            case 'color': return value === 'STD' ? 'STD' : value;
            case 'poder_tintoreo': return value === 'STD' ? 'STD' : value;
            default: return value;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-zinc-200/60">
            {/* Header con Degradado Teal Original */}
            <div className="bg-zinc-700 text-white px-4 py-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 tracking-tight">
                            <FlaskConical size={20} />
                            Especificaciones Técnicas
                        </h3>
                        <p className="text-white font-medium text-[11px]">
                            {selectedProductData.nombre}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-semibold text-white uppercase">
                            {productDetail?.item?.codigo}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla de Parámetros */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-zinc-50 border-b border-zinc-100">
                        <tr>
                            <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                Parámetro
                            </th>
                            <th className="px-3 py-2 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                Patrón / Norma
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-zinc-50">
                        {Object.entries(productDetail?.item || {})
                            .filter(([key]) => PARAMETER_DEFINITIONS[key]) 
                            .map(([key, value]) => {
                                const { label, icon } = PARAMETER_DEFINITIONS[key];
                                return (
                                    <tr key={key} className="hover:bg-teal-50/30 transition-colors">
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="shrink-0 mr-3 p-1 bg-zinc-50 rounded border border-zinc-100">
                                                    {icon}
                                                </div>
                                                <div className="text-xs font-semibold text-zinc-700 uppercase tracking-tighter">
                                                    {label}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-3 py-2.5 whitespace-nowrap text-center">
                                            <div className="text-xs font-bold text-zinc-900 font-mono">
                                                {formatValue(key, value)}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>

            {/* Footer Teal Original */}
            <div className="bg-zinc-50 px-4 py-2 border-t border-zinc-200">
                <div className="flex justify-between items-center text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                    <div>
                        Certificado de Calidad Pinca
                    </div>
                    <div>
                        Rev: 2026-03
                    </div>
                </div>
            </div>
        </div>
    );
};