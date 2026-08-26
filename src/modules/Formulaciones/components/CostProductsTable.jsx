import { useMemo } from 'react';
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
import ErpTable from '../../../shared/ErpTable';

const COST_DEFINITIONS = {
    costo_mp_galon: { label: 'COSTO MP/GALÓN', icon: <FlaskConical className="text-semantic-info" size={14} /> },
    costo_mod:      { label: 'COSTO MOD',       icon: <Briefcase className="text-semantic-success" size={14} /> },
    envase:         { label: 'ENVASE',          icon: <Box className="text-semantic-warning" size={14} /> },
    etiqueta:       { label: 'ETIQUETA',        icon: <Tag className="text-semantic-danger" size={14} /> },
    bandeja:        { label: 'BANDEJA',         icon: <Tag className="text-brand-primary-active" size={14} /> },
    plastico:       { label: 'PLÁSTICO',        icon: <Droplets className="text-semantic-info" size={14} /> },
};

export const CostProductsTable = ({
    selectedProductData,
    productDetail = null,
    compact = false,
    recalculatedData,
    costosProveedor = null,
    isLoading = false,
    totalUnificadoMP = null,   // total MP con precios de proveedor seleccionados (número)
}) => {

    const openDrawer = useBoundStore(state => state.openDrawer);

    // Parsea valor formateado COP ("1.234.567") → número
    const parseCOP = (val) => {
        if (val == null || val === '') return 0;
        if (typeof val === 'number') return val;
        return parseFloat(String(val).replace(/\./g, '').replace(',', '.')) || 0;
    };
    const fmtNum = (n) =>
        new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(Number(n) || 0);

    // Costo total por galón usando proveedores seleccionados en la tabla
    const costoTotalConProv = (() => {
        if (totalUnificadoMP == null) return null;
        const costos = productDetail?.costos;
        if (!costos) return null;
        const volumen = parseFloat(productDetail?.item?.volumen_base) || 1;
        const overhead = parseCOP(costos.envase)
            + parseCOP(costos.etiqueta)
            + parseCOP(costos.bandeja)
            + parseCOP(costos.plastico)
            + parseCOP(costos.costo_mod);
        return (totalUnificadoMP / volumen) + overhead;
    })();

    // costo_mp_galon con proveedores
    const costoMPGalonConProv = (() => {
        if (totalUnificadoMP == null) return null;
        const volumen = parseFloat(productDetail?.item?.volumen_base) || 1;
        return totalUnificadoMP / volumen;
    })();

    // Filas de costo + 2 filas de total, todas con la misma forma de columnas
    // (garantiza alineación pixel-perfect entre datos y totales).
    const rows = useMemo(() => {
        const costRows = productDetail?.costos
            ? Object.entries(productDetail.costos)
                .filter(([key]) => COST_DEFINITIONS[key])
                .map(([key, value]) => {
                    const { label, icon } = COST_DEFINITIONS[key];
                    const mpGalonOverride = key === 'costo_mp_galon' && costoMPGalonConProv != null;
                    const originalValue = mpGalonOverride ? fmtNum(costoMPGalonConProv) : value;
                    const recalcValue = mpGalonOverride
                        ? fmtNum(costoMPGalonConProv)
                        : (recalculatedData?.recalculados?.[key] ?? value);
                    return {
                        id: key, __type: 'costo', label, icon, originalValue, recalcValue,
                        proveedorValue: costosProveedor?.costos_proveedor?.[key] || value || '-',
                    };
                })
            : [];

        const ventaOriginal = costoTotalConProv != null
            ? `$ ${fmtNum(costoTotalConProv)}`
            : `$ ${productDetail?.costos?.total || 0}`;
        const ventaRecalc = costoTotalConProv != null
            ? `$ ${fmtNum(costoTotalConProv)}`
            : (recalculatedData?.recalculados?.total ? `$ ${recalculatedData.recalculados.total}` : '-');

        const pctUtilidad = parseFloat(productDetail?.costos?.porcentaje_utilidad) || 50;
        const sugeridaOriginal = costoTotalConProv != null
            ? `$ ${fmtNum(costoTotalConProv * (1 + pctUtilidad / 100))}`
            : `$ ${productDetail?.costos?.precio_venta || '-'}`;
        const sugeridaRecalc = costoTotalConProv != null
            ? `$ ${fmtNum(costoTotalConProv * (1 + pctUtilidad / 100))}`
            : (recalculatedData?.recalculados?.precio_venta ? `$ ${recalculatedData.recalculados.precio_venta}` : '-');

        return [
            ...costRows,
            {
                id: '__total', __type: 'total', label: 'COSTO TOTAL',
                originalValue: ventaOriginal, recalcValue: ventaRecalc,
                proveedorValue: costosProveedor?.costos_proveedor?.total || '-',
            },
            {
                id: '__venta', __type: 'venta', label: 'VENTA SUGERIDA', pctUtilidad,
                originalValue: sugeridaOriginal, recalcValue: sugeridaRecalc,
                proveedorValue: costosProveedor?.costos_proveedor?.precio_venta || '-',
            },
        ];
    }, [productDetail, recalculatedData, costosProveedor, costoMPGalonConProv, costoTotalConProv]);

    const columns = useMemo(() => {
        const cols = [
            {
                key: 'label', label: 'Concepto',
                render: (v, row) => {
                    if (row.__type === 'costo') {
                        return (
                            <div className="flex items-center">
                                <div className="shrink-0 mr-3 p-1 bg-surface-subtle rounded border border-border-subtle">{row.icon}</div>
                                <div className="text-xs font-semibold text-content-secondary uppercase tracking-tighter">{v}</div>
                            </div>
                        );
                    }
                    return (
                        <div className="flex items-center">
                            <div className="shrink-0 mr-3">
                                <DollarSign className={row.__type === 'venta' ? 'text-content-inverse' : 'text-semantic-success-fg'} size={16} />
                            </div>
                            <div className={`text-xs font-bold uppercase ${row.__type === 'venta' ? 'text-content-inverse' : ''}`}>
                                {v}
                                {row.__type === 'venta' && (
                                    <span className="ml-1 bg-surface-base text-content-primary px-1.5 py-0.5 rounded text-[9px]">{row.pctUtilidad}%</span>
                                )}
                            </div>
                        </div>
                    );
                },
            },
            {
                key: 'originalValue', label: <span className="inline-flex items-center gap-1"><DollarSign size={10} /> Original</span>, align: 'center',
                render: (v, row) => row.__type === 'costo'
                    ? <span className="text-xs font-semibold text-content-muted">$ {v || '-'}</span>
                    : <span className={row.__type === 'venta' ? 'text-xs text-content-inverse opacity-70' : 'text-xs font-semibold text-content-muted'}>{v}</span>,
            },
            {
                key: 'recalcValue', label: <span className="inline-flex items-center gap-1"><DollarSign size={10} /> Valor Recalculado</span>, align: 'center',
                render: (v, row) => {
                    if (row.__type === 'costo') {
                        return <span className={`text-xs font-bold ${v ? 'text-semantic-success-fg' : 'text-content-muted'}`}>$ {v || '-'}</span>;
                    }
                    if (row.__type === 'total') {
                        return <span className="text-lg font-bold text-semantic-success-fg tracking-tighter">{v}</span>;
                    }
                    return <span className="text-lg font-bold tracking-tighter text-content-inverse">{v}</span>;
                },
            },
        ];
        if (costosProveedor) {
            cols.push({
                key: 'proveedorValue', label: <span className="inline-flex items-center gap-1 text-semantic-warning-fg"><Truck size={10} /> Proveedor</span>, align: 'center',
                render: (v, row) => {
                    if (row.__type === 'costo') return <span className="text-xs font-bold text-semantic-warning-fg">$ {v}</span>;
                    return <span className="text-lg font-bold tracking-tighter text-semantic-warning">$ {v}</span>;
                },
            });
        }
        return cols;
    }, [costosProveedor]);

    if (!selectedProductData) {
        return (
            <div className="bg-surface-base rounded-lg shadow-sm p-4 text-center border border-border-base/60">
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

    return (
        <div className="bg-surface-base rounded-lg shadow-sm overflow-hidden border border-border-base/60">

            {/* Header */}
            <div className="tbl-header px-4 py-3">
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
                                className="p-1.5 rounded-lg bg-content-inverse/10 hover:bg-content-inverse/25 text-content-inverse transition-colors"
                            >
                                <Pencil size={14} />
                            </button>
                        )}
                </div>
            </div>

            {/* Tabla — sin columna Acciones */}
            <ErpTable
                columns={columns}
                data={rows}
                isLoading={isLoading}
                rowClassName={(row) =>
                    row.__type === 'total' ? 'font-semibold'
                    : row.__type === 'venta' ? 'tbl-header font-semibold'
                    : 'hover:bg-semantic-success-subtle/30 transition-colors'}
                borderless
            />

            {/* Footer fecha */}
            <div className="bg-surface-subtle px-4 py-2 border-t border-border-base flex justify-between items-center text-[9px] font-semibold text-content-muted uppercase">
                <div>Pinca S.A.S — División de Costos</div>
                <div>Calculado: {productDetail?.costos?.fecha_calculo || 'N/A'}</div>
            </div>
        </div>
    );
};
