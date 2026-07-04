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
    productDetail,
    isLoading = false,
}) => {

    // 1. Estado de espera (Estilo Original)
    if (!selectedProductData) {
        return (
            <div className="bg-surface-base rounded-lg shadow-sm p-4 text-center border border-border-base/60">
                <div className="text-content-muted mb-3">
                    <Beaker size={48} className="mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-content-primary mb-2">
                    Especificaciones Técnicas
                </h3>
                <p className="text-xs text-content-tertiary">
                    Selecciona un producto para ver sus especificaciones
                </p>
            </div>
        );
    }

    // 🚩 MAPEADO DE PARAMETROS CON ICONOS LUCIDE
    const PARAMETER_DEFINITIONS = {
        viscosidad: {
            label: 'VISCOSIDAD',
            icon: <Droplets className="text-semantic-info" size={14} />,
            format: (v) => v || '-'
        },
        p_g: {
            label: 'P / G',
            icon: <Weight className="text-semantic-success" size={14} />,
            format: (v) => v || '-'
        },
        brillo: {
            label: 'BRILLO',
            icon: <Eye className="text-semantic-warning" size={14} />,
            format: (v) => (v === 'MATE' ? 'MATE' : v || '-')
        },
        brillo_60: {
            label: 'BRILLO 60°',
            icon: <Eye className="text-semantic-warning" size={14} />,
            format: (v) => v || '-'
        },
        molienda: {
            label: 'MOLIENDA',
            icon: <Eye className="text-brand-primary-active" size={14} />,
            format: (v) => (v ? `${v} H` : '-')
        },
        secado: {
            label: 'SECADO',
            icon: <Clock className="text-semantic-warning" size={14} />,
            format: (v) => v || '-'
        },
        cubrimiento: {
            label: 'CUBRIMIENTO',
            icon: <Paintbrush className="text-brand-primary" size={14} />,
            format: (v) => v || '-'
        },
        color: {
            label: 'COLOR',
            icon: <Palette className="text-semantic-danger" size={14} />,
            format: (v) => (v === 'STD' ? 'STD' : v || '-')
        },
        ph: {
            label: 'PH',
            icon: <Activity className="text-semantic-info" size={14} />,
            format: (v) => (v === 0 ? '-' : v || '-')
        },
        poder_tintoreo: {
            label: 'PODER TINTÓREO',
            icon: <Palette className="text-brand-primary-active" size={14} />,
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
        <div className="bg-surface-base rounded-lg shadow-sm overflow-hidden border border-border-base/60">
            {/* Header con Degradado Teal Original */}
            <div className="tbl-header px-4 py-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2 tracking-tight">
                            <FlaskConical size={20} />
                            Especificaciones Técnicas
                        </h3>
                        <p className="text-content-inverse font-medium text-[11px]">
                            {selectedProductData.nombre}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-semibold text-content-inverse uppercase">
                            {productDetail?.item?.codigo}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla de Parámetros */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-surface-subtle border-b border-border-subtle">
                        <tr>
                            <th className="px-3 py-2 text-left text-[10px] font-bold text-content-tertiary uppercase tracking-wider">
                                Parámetro
                            </th>
                            <th className="px-3 py-2 text-center text-[10px] font-bold text-content-tertiary uppercase tracking-wider">
                                Patrón / Norma
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-surface-base divide-y divide-border-subtle">
                        {isLoading
                            ? [...Array(6)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 bg-surface-strong rounded shrink-0" />
                                            <div className="h-3 bg-surface-strong rounded w-24" />
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                        <div className="h-3 bg-surface-strong rounded w-12 mx-auto" />
                                    </td>
                                </tr>
                            ))
                            : Object.entries(productDetail?.item || {})
                                .filter(([key]) => PARAMETER_DEFINITIONS[key])
                                .map(([key, value]) => {
                                    const { label, icon } = PARAMETER_DEFINITIONS[key];
                                    return (
                                        <tr key={key} className="hover:bg-semantic-info-subtle/30 transition-colors">
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="shrink-0 mr-3 p-1 bg-surface-subtle rounded border border-border-subtle">
                                                        {icon}
                                                    </div>
                                                    <div className="text-xs font-semibold text-content-secondary uppercase tracking-tighter">
                                                        {label}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 whitespace-nowrap text-center">
                                                <div className="text-xs font-bold text-content-primary">
                                                    {formatValue(key, value)}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                        }
                    </tbody>
                </table>
            </div>

            {/* Footer Teal Original */}
            <div className="bg-surface-subtle px-4 py-2 border-t border-border-base">
                <div className="flex justify-between items-center text-[9px] font-bold text-content-muted uppercase tracking-widest">
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