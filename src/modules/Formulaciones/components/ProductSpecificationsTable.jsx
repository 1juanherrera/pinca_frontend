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
import ErpTable from '../../../shared/ErpTable';

const PARAMETER_DEFINITIONS = {
    viscosidad: {
        label: 'VISCOSIDAD',
        icon: <Droplets className="text-semantic-info" size={14} />,
    },
    p_g: {
        label: 'P / G',
        icon: <Weight className="text-semantic-success" size={14} />,
    },
    brillo: {
        label: 'BRILLO',
        icon: <Eye className="text-semantic-warning" size={14} />,
    },
    brillo_60: {
        label: 'BRILLO 60°',
        icon: <Eye className="text-semantic-warning" size={14} />,
    },
    molienda: {
        label: 'MOLIENDA',
        icon: <Eye className="text-brand-primary-active" size={14} />,
    },
    secado: {
        label: 'SECADO',
        icon: <Clock className="text-semantic-warning" size={14} />,
    },
    cubrimiento: {
        label: 'CUBRIMIENTO',
        icon: <Paintbrush className="text-brand-primary" size={14} />,
    },
    color: {
        label: 'COLOR',
        icon: <Palette className="text-semantic-danger" size={14} />,
    },
    ph: {
        label: 'PH',
        icon: <Activity className="text-semantic-info" size={14} />,
    },
    poder_tintoreo: {
        label: 'PODER TINTÓREO',
        icon: <Palette className="text-brand-primary-active" size={14} />,
    },
};

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

    const formatValue = (param, value) => {
        if (!value || value === 0 || value === '0') return '-';
        switch(param.toLowerCase()) {
            case 'molienda': return `${value} H`;
            case 'color': return value === 'STD' ? 'STD' : value;
            case 'poder_tintoreo': return value === 'STD' ? 'STD' : value;
            default: return value;
        }
    };

    const specColumns = [
        {
            key: 'label', label: 'Parámetro',
            render: (v, row) => (
                <div className="flex items-center">
                    <div className="shrink-0 mr-3 p-1 bg-surface-subtle rounded border border-border-subtle">{row.icon}</div>
                    <div className="text-xs font-semibold text-content-secondary uppercase tracking-tighter">{v}</div>
                </div>
            ),
        },
        {
            key: 'value', label: 'Patrón / Norma', align: 'center',
            render: (v, row) => <div className="text-xs font-bold text-content-primary">{formatValue(row.key, v)}</div>,
        },
    ];

    const specRows = Object.entries(productDetail?.item || {})
        .filter(([key]) => PARAMETER_DEFINITIONS[key])
        .map(([key, value]) => ({ id: key, key, value, label: PARAMETER_DEFINITIONS[key].label, icon: PARAMETER_DEFINITIONS[key].icon }));

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
            <ErpTable
                columns={specColumns}
                data={specRows}
                isLoading={isLoading}
                rowClassName={() => 'hover:bg-semantic-info-subtle/30 transition-colors'}
                borderless
            />

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