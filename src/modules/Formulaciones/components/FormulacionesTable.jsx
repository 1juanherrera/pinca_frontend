import { useEffect, useMemo } from 'react';
import { FlaskConical, DollarSign, Truck, Pencil, Copy, AlertTriangle, Scale } from 'lucide-react';
import { parseCOP } from '../utils/handlers';
import { fmtCOP } from './FormulacionesTable/helpers';
import FilaLinea from './FormulacionesTable/FilaLinea';
import FilaIngrediente from './FormulacionesTable/FilaIngrediente';

export const FormulacionesTable = ({
    selectedProductData,
    compact = false,
    productDetail = null,
    recalculatedData,
    costosProveedor = null,
    opcionesIngredientes = null,
    seleccionPorIngrediente = {},
    onSeleccionIngrediente,
    costMode = 'real',
    onEdit,
    onClone,
    isLoading = false,
    onTotalUnificado,
}) => {
    const dataToShow = recalculatedData || productDetail;
    const proveedorMap = {};
    if (costosProveedor?.formulaciones) {
        costosProveedor.formulaciones.forEach((f) => {
            proveedorMap[f.item_general_id] = f;
        });
    }

    const materiasOpciones = useMemo(() => opcionesIngredientes?.materias ?? {}, [opcionesIngredientes]);

    const handleSelectProveedor = (itemGeneralId, itemProveedorId) => {
        if (!onSeleccionIngrediente) return;
        onSeleccionIngrediente((prev) => {
            const next = { ...prev };
            if (itemProveedorId) {
                next[itemGeneralId] = itemProveedorId;
            } else {
                delete next[itemGeneralId];
            }
            return next;
        });
    };

    // Resuelve qué proveedor "efectivo" mostrar por ingrediente:
    //   1. Override manual del usuario (selección explícita en el dropdown).
    //   2. Sino, si costMode === 'lista': el más barato (opciones[0]).
    //   3. Sino (costMode === 'real'): null → la tabla cae al costo estándar
    //      (promedio ponderado de capas vía costos_item.costo_unitario).
    const getOpcionEfectiva = (mpId) => {
        const matInfo = materiasOpciones[mpId];
        if (!matInfo?.opciones?.length) return null;
        const selectedIpId = seleccionPorIngrediente[mpId];
        if (selectedIpId) {
            return matInfo.opciones.find((o) => o.id_item_proveedor === selectedIpId) ?? null;
        }
        if (costMode === 'lista') {
            return matInfo.opciones[0]; // backend ya las ordena por precio_por_kg ASC
        }
        return null;
    };

    const getCostoOverride = (formulacion) => {
        const opcion = getOpcionEfectiva(formulacion.item_general_id);
        if (!opcion) return null;

        const cantidad = recalculatedData
          ? (formulacion.cantidad_recalculada ?? formulacion.cantidad)
          : formulacion.cantidad;

        return {
            costo_unitario: opcion.precio_por_kg,
            costo_total: (Number(cantidad) * opcion.precio_por_kg).toFixed(2),
            nombre_empresa: opcion.nombre_empresa,
        };
    };

    // Último precio = costo de la última recepción (capa más reciente) de la MP.
    // Es informativo, ADICIONAL al costo promedio ponderado. Puede venir en la
    // fila de la formulación, en el nodo materia, o en la opción de proveedor.
    const getUltimoPrecio = (formulacion) => {
        const mpId = formulacion.item_general_id;
        const materia = materiasOpciones[mpId];
        const opcion = getOpcionEfectiva(mpId);
        const val =
            formulacion?.ultimo_precio ??
            materia?.ultimo_precio ??
            opcion?.ultimo_precio ??
            null;
        const num = Number(val);
        return Number.isFinite(num) && num > 0 ? num : null;
    };

    // Total unificado y conteo de ingredientes sin proveedor. Inlineado para que
    // el compilador pueda memoizar sin depender de closures (`getCostoOverride`).
    const { totalUnificado, sinProveedor } = useMemo(() => {
        if (!dataToShow?.formulaciones) return { totalUnificado: null, sinProveedor: 0 };
        const resolveOpcion = (mpId) => {
            const matInfo = materiasOpciones[mpId];
            if (!matInfo?.opciones?.length) return null;
            const selectedIpId = seleccionPorIngrediente[mpId];
            if (selectedIpId) {
                return matInfo.opciones.find((o) => o.id_item_proveedor === selectedIpId) ?? null;
            }
            if (costMode === 'lista') return matInfo.opciones[0];
            return null;
        };
        let total = 0;
        let sinProv = 0;
        for (const f of dataToShow.formulaciones) {
            // Las instrucciones/fases no cuentan como ingrediente en los totales.
            if ((f.tipo ?? 'ingrediente') !== 'ingrediente') continue;
            const opcion = resolveOpcion(f.item_general_id);
            if (opcion) {
                const cantidad = recalculatedData
                  ? (f.cantidad_recalculada ?? f.cantidad)
                  : f.cantidad;
                total += Number(cantidad) * opcion.precio_por_kg;
            } else {
                const esAguaCalc = (f.materia_prima_nombre || '').toUpperCase().trim() === 'AGUA';
                if (!esAguaCalc) sinProv++;
                // costo_total_materia(_recalculado) llega formateado en COP ("9.600", con
                // '.' de miles) — Number() lo malinterpreta como decimal (9.6). parseCOP
                // lo parsea correctamente. Bug real: hacía desaparecer ~99.9% del costo de
                // cualquier ingrediente sin proveedor vinculado (ej. AGUA) del total.
                total += parseCOP(
                  recalculatedData
                    ? (f.costo_total_materia_recalculado ?? f.costo_total_materia)
                    : f.costo_total_materia
                );
            }
        }
        return { totalUnificado: total.toFixed(2), sinProveedor: sinProv };
    }, [seleccionPorIngrediente, dataToShow, materiasOpciones, recalculatedData, costMode]);

    // Notificar al padre cuando cambie el total unificado (para el modal de preparación).
    useEffect(() => {
        if (onTotalUnificado) onTotalUnificado(totalUnificado ? parseFloat(totalUnificado) : null);
    }, [totalUnificado, onTotalUnificado]);

    // Empty state: sin producto seleccionado. Se evalúa DESPUÉS de los hooks
    // para no romper las reglas de hooks (orden estable en cada render).
    if (!selectedProductData) {
        return (
            <div className="bg-surface-base rounded-lg shadow-sm p-4 text-center">
                <div className="text-content-muted mb-3">
                    <FlaskConical size={compact ? 32 : 48} className="mx-auto" />
                </div>
                <h3 className={`${compact ? 'text-base' : 'text-lg'} font-medium text-content-primary mb-2`}>
                    Formulaciones
                </h3>
                <p className="text-sm text-content-tertiary">
                    Selecciona un producto para ver sus formulaciones
                </p>
            </div>
        );
    }

    return (
        <div className="bg-surface-base rounded-lg shadow-sm overflow-visible border border-border-base/60">
            {/* Header */}
            <div className="tbl-header px-4 py-3 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold flex items-center gap-2`}>
                            <FlaskConical size={compact ? 16 : 20} />
                            Formulaciones
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
                        <p className="text-content-inverse text-xs">
                            {productDetail?.item?.nombre} - {productDetail?.item?.codigo}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-xs text-content-inverse overflow-hidden truncate max-w-40">
                                vol: {recalculatedData ? recalculatedData?.item?.volumen_nuevo : productDetail?.item?.volumen_base || 0}
                            </div>
                            <div className="text-xs text-content-inverse">
                                {productDetail?.formulaciones?.length || 0} componentes
                            </div>
                        </div>
                        {onClone && (
                            <button
                                type="button"
                                onClick={() => onClone(selectedProductData)}
                                title="Clonar fórmula a otro producto"
                                className="p-1.5 rounded-lg bg-content-inverse/10 hover:bg-content-inverse/25 text-content-inverse transition-colors"
                            >
                                <Copy size={14} />
                            </button>
                        )}
                        {onEdit && (
                            <button
                                type="button"
                                onClick={() => onEdit(selectedProductData.id_item_general)}
                                title="Editar formulación"
                                className="p-1.5 rounded-lg bg-content-inverse/10 hover:bg-content-inverse/25 text-content-inverse transition-colors"
                            >
                                <Pencil size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse divide-y divide-border-base">
                    <thead className="bg-surface-subtle">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">
                                #
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-content-secondary uppercase tracking-wider">
                                Materia Prima
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-content-secondary uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <Scale size={14} className="text-content-muted" />
                                    Cantidad
                                </div>
                            </th>
                             <th className="px-3 py-2 text-center text-xs font-medium text-content-secondary uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <Scale size={14} className="text-content-muted" />
                                    Cantidad Disp.
                                </div>
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-content-secondary uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <DollarSign size={14} className="text-content-muted" />
                                    Costo Unit.
                                </div>
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-content-secondary uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <DollarSign size={14} className="text-content-muted" />
                                    Último precio
                                </div>
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-content-secondary uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <DollarSign size={14} className="text-content-muted" />
                                    Costo Total
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-surface-base divide-y divide-border-base">
                    {isLoading ? (
                        [...Array(5)].map((_, i) => (
                            <tr key={i} className="animate-pulse">
                                <td className="px-3 py-3"><div className="h-3 w-4 bg-surface-strong rounded mx-auto" /></td>
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-7 w-7 rounded-full bg-surface-strong shrink-0" />
                                        <div className="space-y-1.5 flex-1">
                                            <div className="h-3 bg-surface-strong rounded w-3/4" />
                                            <div className="h-2.5 bg-surface-muted rounded w-1/3" />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-3"><div className="h-3 bg-surface-strong rounded w-12 mx-auto" /></td>
                                <td className="px-3 py-3"><div className="h-3 bg-surface-strong rounded w-12 mx-auto" /></td>
                                <td className="px-3 py-3"><div className="h-3 bg-surface-strong rounded w-16 mx-auto" /></td>
                                <td className="px-3 py-3"><div className="h-3 bg-surface-strong rounded w-16 mx-auto" /></td>
                                <td className="px-3 py-3"><div className="h-3 bg-surface-strong rounded w-16 mx-auto" /></td>
                            </tr>
                        ))
                    ) : dataToShow?.formulaciones && Array.isArray(dataToShow.formulaciones) && dataToShow.formulaciones.length > 0 ? (
                            dataToShow.formulaciones.map((formulacion, index) => {
                            const costoOverride = getCostoOverride(formulacion);
                            const mpId = formulacion.item_general_id;
                            const opciones = materiasOpciones[mpId]?.opciones ?? [];
                            const tieneProveedor = !!seleccionPorIngrediente[mpId];
                            const esAgua = (formulacion.materia_prima_nombre || '').toUpperCase().trim() === 'AGUA';

                            // Fila de instrucción o fase: banda a lo ancho, no es un ingrediente.
                            if ((formulacion.tipo ?? 'ingrediente') !== 'ingrediente') {
                                return <FilaLinea key={`linea-${index}`} formulacion={formulacion} />;
                            }

                            return (
                                <FilaIngrediente
                                    key={`formulacion-row-${index}`}
                                    formulacion={formulacion}
                                    index={index}
                                    costoOverride={costoOverride}
                                    mpId={mpId}
                                    opciones={opciones}
                                    tieneProveedor={tieneProveedor}
                                    esAgua={esAgua}
                                    selectedProveedorId={seleccionPorIngrediente[mpId]}
                                    onSelectProveedor={onSeleccionIngrediente ? handleSelectProveedor : undefined}
                                    recalculatedData={recalculatedData}
                                    prov={proveedorMap[formulacion.item_general_id]}
                                    ultimoPrecio={getUltimoPrecio(formulacion)}
                                />
                            );
                            })
                        ) : (
                            <tr>
                            <td colSpan="7" className="text-center py-10 text-content-muted text-xs uppercase font-bold tracking-widest bg-surface-subtle">
                                No hay componentes disponibles en esta formulación.
                            </td>
                            </tr>
                        )
                        }
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="bg-surface-subtle px-4 py-3 border-t border-border-base">
                <div className="flex justify-end items-center">
                    <div className="flex gap-6 flex-wrap">
                        <div className="text-sm flex items-center gap-1.5">
                            <span className="text-content-secondary font-medium">Total Cantidad: </span>
                            {isLoading
                                ? <div className="h-3 w-10 bg-surface-strong rounded animate-pulse inline-block" />
                                : <span className={`font-bold ${recalculatedData ? 'text-semantic-success-fg' : 'text-semantic-info-fg'}`}>
                                    {!recalculatedData ? productDetail?.costos?.total_cantidad_materia_prima : recalculatedData?.recalculados?.total_cantidad_materia_prima}
                                  </span>
                            }
                        </div>
                        <div className="text-sm border-l border-border-base pl-6 flex items-center gap-1.5">
                            <span className="text-content-secondary font-medium">Total Costo MP: </span>
                            {isLoading
                                ? <div className="h-3 w-20 bg-surface-strong rounded animate-pulse inline-block" />
                                : <span className="font-bold text-content-primary">
                                    {fmtCOP(totalUnificado ?? (!recalculatedData ? productDetail?.costos?.total_costo_materia_prima : recalculatedData?.recalculados?.total_costo_materia_prima))}
                                  </span>
                            }
                        </div>
                        {sinProveedor > 0 && !isLoading && (
                            <div className="text-sm border-l border-border-base pl-6 flex items-center gap-1.5">
                                <AlertTriangle size={13} className="text-semantic-warning-fg" />
                                <span className="text-[11px] text-semantic-warning-fg font-medium">
                                    {sinProveedor} sin proveedor
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
