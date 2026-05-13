import {
  Calculator,
  FlaskConical,
  Briefcase,
  Box,
  Tag,
  Droplets,
  DollarSign,
  Pencil,
  Truck
} from 'lucide-react';
import { useBoundStore } from '../../../store/useBoundStore';
import { ButtonSquare } from '../../../shared/Button';

export const CostProductsTable = ({
    selectedProductData,
    productDetail = null,
    compact = false,
    recalculatedData,
    costosProveedor = null,
    isLoading = false,
}) => {

    const openDrawer = useBoundStore(state => state.openDrawer);

    if (!selectedProductData) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-4 text-center border border-border-base/60">
                <div className="text-content-muted mb-3">
                    <Calculator size={48} className="mx-auto" />
                </div>
                <h3 className='text-lg font-medium text-content-primary mb-2'>
                    Desglose de Costos
                </h3>
                <p className="text-xs text-content-primary">
                    Selecciona un producto para ver su desglose de costos
                </p>
            </div>
        );
    }

    const COST_DEFINITIONS = {
        costo_mp_galon: { label: 'COSTO MP/GALÓN', icon: <FlaskConical className="text-semantic-info" size={14} /> },
        costo_mg_kg:    { label: 'COSTO MG/KG',    icon: <FlaskConical className="text-semantic-info" size={14} /> },
        costo_mod:      { label: 'COSTO MOD',       icon: <Briefcase className="text-semantic-success" size={14} /> },
        envase:         { label: 'ENVASE',          icon: <Box className="text-semantic-warning" size={14} /> },
        etiqueta:       { label: 'ETIQUETA',        icon: <Tag className="text-semantic-danger" size={14} /> },
        bandeja:        { label: 'BANDEJA',         icon: <Tag className="text-brand-primary-active" size={14} /> },
        plastico:       { label: 'PLÁSTICO',        icon: <Droplets className="text-semantic-info" size={14} /> },
    };

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-border-base/60">

            {/* Header */}
            <div className="bg-content-secondary text-white px-4 py-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold flex items-center gap-2 tracking-tight`}>
                            <Calculator size={compact ? 16 : 20} />
                            Desglose de Costos
                            {recalculatedData && (
                                <span className="bg-semantic-success text-white text-xs px-2 py-0.5 rounded-sm ml-2">
                                    Calculado
                                </span>
                            )}
                            {costosProveedor && (
                                <span className="bg-semantic-warning text-white text-xs px-2 py-0.5 rounded-sm ml-1 flex items-center gap-1">
                                    <Truck size={10} /> {costosProveedor.proveedor?.nombre_empresa}
                                </span>
                            )}
                        </h3>
                        <p className="text-xs opacity-90">
                            {productDetail?.item?.nombre || selectedProductData.nombre}
                        </p>
                    </div>

                        {/* Único botón de edición — abre el drawer con todo el productDetail */}
                        {productDetail?.costos && (
                            <button
                                type="button"
                                onClick={() => openDrawer('COSTOS_FORM', productDetail)}
                                title="Editar costos indirectos"
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors"
                            >
                                <Pencil size={14} />
                            </button>
                        )}
                </div>
            </div>

            {/* Tabla — sin columna Acciones */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-surface-subtle border-b border-border-base">
                        <tr>
                            <th className="px-3 py-2 text-left text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
                                Concepto
                            </th>
                            <th className="px-3 py-2 text-center text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <DollarSign size={10} /> Original
                                </div>
                            </th>
                            <th className="px-3 py-2 text-center text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <DollarSign size={10} /> Valor Recalculado
                                </div>
                            </th>
                            {costosProveedor && (
                                <th className="px-3 py-2 text-center text-[10px] font-semibold text-semantic-warning-fg uppercase tracking-wider">
                                    <div className="flex items-center justify-center gap-1">
                                        <Truck size={10} /> Proveedor
                                    </div>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-border-subtle">
                        {isLoading
                            ? [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 bg-surface-strong rounded shrink-0" />
                                            <div className="h-3 bg-surface-strong rounded w-20" />
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-center"><div className="h-3 bg-surface-strong rounded w-16 mx-auto" /></td>
                                    <td className="px-3 py-2.5 text-center"><div className="h-3 bg-surface-strong rounded w-16 mx-auto" /></td>
                                    {costosProveedor && <td className="px-3 py-2.5 text-center"><div className="h-3 bg-surface-strong rounded w-16 mx-auto" /></td>}
                                </tr>
                            ))
                            : productDetail?.costos &&
                                Object.entries(productDetail.costos)
                                    .filter(([key]) => COST_DEFINITIONS[key])
                                    .map(([key, value]) => {
                                        const { label, icon } = COST_DEFINITIONS[key];
                                        return (
                                            <tr key={key} className="hover:bg-semantic-success-subtle/30 transition-colors">
                                                <td className="px-3 py-2 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="shrink-0 mr-3 p-1 bg-surface-subtle rounded border border-border-subtle">
                                                            {icon}
                                                        </div>
                                                        <div className="text-xs font-semibold text-content-secondary uppercase tracking-tighter">
                                                            {label}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap text-center">
                                                    <div className="px-3 py-2 whitespace-nowrap text-center text-xs font-semibold text-content-muted">
                                                        $ {value || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2 whitespace-nowrap text-center text-xs font-semibold text-content-muted">
                                                    <div className={`text-xs font-bold ${value ? 'text-semantic-success-fg' : 'text-content-muted'}`}>
                                                        $ {value || '-'}
                                                    </div>
                                                </td>
                                                {costosProveedor && (
                                                    <td className="px-3 py-2 whitespace-nowrap text-center">
                                                        <div className="text-xs font-bold text-semantic-warning-fg">
                                                            $ {costosProveedor.costos_proveedor?.[key] || value || '-'}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                        }
                    </tbody>

                    {/* Footer totales */}
                    <tfoot>
                        <tr className="font-semibold">
                            <td className="px-3 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="shrink-0 mr-3">
                                        <DollarSign className="text-semantic-success-fg" size={16} />
                                    </div>
                                    <div className="text-xs font-bold text-content-primary uppercase">
                                        COSTO TOTAL
                                    </div>
                                </div>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-center">
                                {isLoading
                                    ? <div className="h-3 w-16 bg-surface-strong rounded animate-pulse mx-auto" />
                                    : <div className="text-xs font-semibold text-content-muted">$ {productDetail?.costos?.total || 0}</div>
                                }
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-center">
                                {isLoading
                                    ? <div className="h-4 w-20 bg-surface-strong rounded animate-pulse mx-auto" />
                                    : <div className="text-lg font-bold text-semantic-success-fg tracking-tighter">$ {recalculatedData?.recalculados?.total || '-'}</div>
                                }
                            </td>
                            {costosProveedor && (
                                <td className="px-3 py-3 whitespace-nowrap text-center">
                                    <div className="text-lg font-bold text-semantic-warning-fg tracking-tighter">
                                        $ {costosProveedor.costos_proveedor?.total || '-'}
                                    </div>
                                </td>
                            )}
                        </tr>
                        <tr className="bg-content-secondary font-semibold text-white">
                            <td className="px-3 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="shrink-0 mr-3">
                                        <DollarSign className="text-white" size={16} />
                                    </div>
                                    <div className="text-xs font-bold uppercase">
                                        VENTA SUGERIDA
                                        <span className="ml-1 bg-white text-content-primary px-1.5 py-0.5 rounded text-[9px]">
                                            {productDetail?.costos?.porcentaje_utilidad ?? 50}%
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td className="whitespace-nowrap text-center">
                                <div className="px-3 py-3 whitespace-nowrap text-center text-xs opacity-70">
                                    $ {productDetail?.costos?.precio_venta || '-'}
                                </div>
                            </td>
                            <td className="text-lg font-bold tracking-tighter text-center">
                                $ {recalculatedData?.recalculados?.precio_venta || '-'}
                            </td>
                            {costosProveedor && (
                                <td className="text-lg font-bold tracking-tighter text-center text-semantic-warning">
                                    $ {costosProveedor.costos_proveedor?.precio_venta || '-'}
                                </td>
                            )}
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer fecha */}
            <div className="bg-surface-subtle px-4 py-2 border-t border-border-base flex justify-between items-center text-[9px] font-semibold text-content-muted uppercase">
                <div>Pinca S.A.S — División de Costos</div>
                <div>Calculado: {productDetail?.costos?.fecha_calculo || 'N/A'}</div>
            </div>
        </div>
    );
};