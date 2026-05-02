import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FlaskConical, Beaker, Scale, DollarSign, Truck, ChevronDown, X, Pencil } from 'lucide-react';

const fmtCOP = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v) || 0);

const IngredienteProveedorSelect = ({ opciones, selectedId, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef(null);
  const dropRef = useRef(null);

  const updateCoords = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setCoords({ top: r.bottom + 2, left: r.left, width: Math.max(r.width, 260) });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateCoords();
    const handler = () => updateCoords();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (dropRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = opciones.find((o) => o.id_item_proveedor === selectedId);

  if (!opciones.length) {
    return (
      <span className="text-[9px] text-zinc-400 italic">Sin proveedores</span>
    );
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border transition-all max-w-[160px] ${
          selected
            ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100'
        }`}
      >
        <Truck size={9} className="shrink-0" />
        <span className="truncate">
          {selected ? selected.nombre_empresa : 'Proveedor'}
        </span>
        <ChevronDown size={9} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {selected && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onSelect(null); }}
          className="text-zinc-400 hover:text-red-500 transition-colors ml-0.5"
        >
          <X size={9} />
        </button>
      )}

      {open && createPortal(
        <div
          ref={dropRef}
          className="fixed z-[9999] bg-white border border-zinc-200 rounded-lg shadow-xl overflow-hidden"
          style={{ top: coords.top, left: coords.left, width: coords.width }}
        >
          <div className="px-2 py-1.5 bg-zinc-50 border-b border-zinc-100">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Proveedores vinculados</p>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {opciones.map((op) => (
              <button
                key={op.id_item_proveedor}
                type="button"
                onClick={() => { onSelect(op.id_item_proveedor); setOpen(false); }}
                className={`w-full text-left px-2.5 py-2 hover:bg-amber-50 transition-colors flex items-center justify-between gap-2 ${
                  op.id_item_proveedor === selectedId ? 'bg-amber-50' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-zinc-800 truncate">{op.nombre_empresa}</p>
                  <p className="text-[9px] text-zinc-400 truncate">{op.nombre_item}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-bold text-amber-700">{fmtCOP(op.precio_por_kg)}/kg</p>
                  {op.unidad_compra && (
                    <p className="text-[9px] text-zinc-400">{fmtCOP(op.precio_unitario)}/{op.unidad_compra}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export const FormulacionesTable = ({
    selectedProductData,
    compact = false,
    productDetail = null,
    recalculatedData,
    costosProveedor = null,
    opcionesIngredientes = null,
    seleccionPorIngrediente = {},
    onSeleccionIngrediente,
    onEdit,
    isLoading = false,
}) => {
    if (!selectedProductData) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-gray-400 mb-3">
                    <FlaskConical size={compact ? 32 : 48} className="mx-auto" />
                </div>
                <h3 className={`${compact ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-2`}>
                    Formulaciones
                </h3>
                <p className="text-sm text-gray-500">
                    Selecciona un producto para ver sus formulaciones
                </p>
            </div>
        );
    }

    const dataToShow = recalculatedData || productDetail;
    const proveedorMap = {};
    if (costosProveedor?.formulaciones) {
        costosProveedor.formulaciones.forEach((f) => {
            proveedorMap[f.item_general_id] = f;
        });
    }

    const materiasOpciones = opcionesIngredientes?.materias ?? {};

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

    const getCostoOverride = (formulacion) => {
        const mpId = formulacion.item_general_id;
        const selectedIpId = seleccionPorIngrediente[mpId];
        if (!selectedIpId) return null;

        const matInfo = materiasOpciones[mpId];
        if (!matInfo) return null;

        const opcion = matInfo.opciones?.find((o) => o.id_item_proveedor === selectedIpId);
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

    const hasAnyOverride = Object.keys(seleccionPorIngrediente).length > 0;

    const totalCostoOverride = useMemo(() => {
        if (!hasAnyOverride || !dataToShow?.formulaciones) return null;
        let total = 0;
        for (const f of dataToShow.formulaciones) {
            const override = getCostoOverride(f);
            if (override) {
                total += Number(override.costo_total);
            } else {
                total += Number(
                  recalculatedData
                    ? (f.costo_total_materia_recalculado ?? f.costo_total_materia)
                    : f.costo_total_materia
                ) || 0;
            }
        }
        return total.toFixed(2);
    }, [seleccionPorIngrediente, dataToShow, materiasOpciones, recalculatedData]);

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-visible border border-zinc-200/60">
            {/* Header */}
            <div className="bg-zinc-700 text-white px-4 py-3 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold flex items-center gap-2`}>
                            <FlaskConical size={compact ? 16 : 20} />
                            Formulaciones
                            {recalculatedData && (
                                <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-sm ml-2">
                                    Calculado
                                </span>
                            )}
                            {costosProveedor && (
                                <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-sm ml-1 flex items-center gap-1">
                                    <Truck size={10} /> {costosProveedor.proveedor?.nombre_empresa}
                                </span>
                            )}
                        </h3>
                        <p className="text-white text-xs">
                            {productDetail?.item?.nombre} - {productDetail?.item?.codigo}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-xs text-white overflow-hidden truncate w-40">
                                vol: {recalculatedData ? recalculatedData?.item?.volumen_nuevo : productDetail?.item?.volumen_base || 0}
                            </div>
                            <div className="text-xs text-white">
                                {productDetail?.formulaciones?.length || 0} componentes
                            </div>
                        </div>
                        {onEdit && (
                            <button
                                type="button"
                                onClick={() => onEdit(selectedProductData.id_item_general)}
                                title="Editar formulación"
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors"
                            >
                                <Pencil size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                #
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Materia Prima
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <Scale size={14} className="text-gray-400" />
                                    Cantidad
                                </div>
                            </th>
                             <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <Scale size={14} className="text-gray-400" />
                                    Cantidad Disp.
                                </div>
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <DollarSign size={14} className="text-gray-400" />
                                    Costo Unit.
                                </div>
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <DollarSign size={14} className="text-gray-400" />
                                    Costo Total
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                        [...Array(5)].map((_, i) => (
                            <tr key={i} className="animate-pulse">
                                <td className="px-3 py-3"><div className="h-3 w-4 bg-zinc-200 rounded mx-auto" /></td>
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-7 w-7 rounded-full bg-zinc-200 shrink-0" />
                                        <div className="space-y-1.5 flex-1">
                                            <div className="h-3 bg-zinc-200 rounded w-3/4" />
                                            <div className="h-2.5 bg-zinc-100 rounded w-1/3" />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-3 py-3"><div className="h-3 bg-zinc-200 rounded w-12 mx-auto" /></td>
                                <td className="px-3 py-3"><div className="h-3 bg-zinc-200 rounded w-12 mx-auto" /></td>
                                <td className="px-3 py-3"><div className="h-3 bg-zinc-200 rounded w-16 mx-auto" /></td>
                                <td className="px-3 py-3"><div className="h-3 bg-zinc-200 rounded w-16 mx-auto" /></td>
                            </tr>
                        ))
                    ) : dataToShow?.formulaciones && Array.isArray(dataToShow.formulaciones) && dataToShow.formulaciones.length > 0 ? (
                            dataToShow.formulaciones.map((formulacion, index) => {
                            const costoOverride = getCostoOverride(formulacion);
                            const mpId = formulacion.item_general_id;
                            const opciones = materiasOpciones[mpId]?.opciones ?? [];

                            return (
                            <tr key={`formulacion-row-${index}`} className={`transition-colors ${costoOverride ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-gray-50'}`}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                {index + 1}
                                </td>

                                {/* MATERIA PRIMA + SELECTOR PROVEEDOR */}
                                <td className="px-3 py-2">
                                <div className="flex items-center">
                                    <div className="shrink-0 h-7 w-7 rounded-full bg-white flex items-center justify-center border border-blue-200 shadow-inner">
                                    <Beaker className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="ml-3 min-w-0">
                                    <div className="text-xs font-semibold text-gray-900 uppercase tracking-tight">
                                        {formulacion.materia_prima_nombre || 'Sin nombre'}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span className="text-xs text-blue-600 font-medium">
                                            {formulacion.materia_prima_codigo || 'Sin código'}
                                        </span>
                                        {opciones.length > 0 && onSeleccionIngrediente && (
                                            <IngredienteProveedorSelect
                                                opciones={opciones}
                                                selectedId={seleccionPorIngrediente[mpId] ?? null}
                                                onSelect={(ipId) => handleSelectProveedor(mpId, ipId)}
                                            />
                                        )}
                                    </div>
                                    </div>
                                </div>
                                </td>

                                {/* CANTIDAD */}
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className={`text-sm font-bold ${recalculatedData ? 'text-green-600' : 'text-blue-600'}`}>
                                    {recalculatedData == null ? formulacion.cantidad : formulacion.cantidad_recalculada ?? 0}
                                    {recalculatedData && (
                                        <div className="text-[10px] text-gray-500 font-normal italic tracking-tighter">
                                            Base: {formulacion.cantidad ?? 0}
                                        </div>
                                    )}
                                </div>
                                </td>

                                {/* CANTIDAD DISPONIBLE */}
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                {(() => {
                                    const cantidadRef = recalculatedData
                                        ? (formulacion.cantidad_recalculada ?? formulacion.cantidad)
                                        : formulacion.cantidad;
                                    const suficiente = formulacion.inventario_cantidad >= cantidadRef;
                                    return (
                                        <div className={`text-sm font-bold ${suficiente ? 'text-green-600' : 'text-red-600'}`}>
                                            {formulacion.inventario_cantidad ?? 0}
                                            <div className={`text-[10px] font-normal ${suficiente ? 'text-green-500' : 'text-red-500'}`}>
                                                {suficiente ? 'Suficiente' : 'Insuficiente'}
                                            </div>
                                        </div>
                                    );
                                })()}
                                </td>

                                {/* COSTO UNITARIO */}
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                {(() => {
                                    if (costoOverride) {
                                        return (
                                            <div>
                                                <div className="text-sm font-bold text-amber-600">
                                                    {fmtCOP(costoOverride.costo_unitario)}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-normal italic tracking-tighter flex items-center justify-center gap-0.5">
                                                    <Truck size={8} /> {costoOverride.nombre_empresa}
                                                </div>
                                            </div>
                                        );
                                    }
                                    const prov = proveedorMap[formulacion.item_general_id];
                                    if (prov) {
                                        return (
                                            <div>
                                                <div className={`text-sm font-bold ${prov.usa_precio_proveedor ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    $ {prov.costo_unitario_efectivo}
                                                </div>
                                                {prov.usa_precio_proveedor && (
                                                    <div className="text-[10px] text-gray-400 font-normal italic tracking-tighter flex items-center justify-center gap-0.5">
                                                        <Truck size={8} /> Prov.
                                                        <span className="ml-1 line-through">$ {prov.costo_unitario_estandar}</span>
                                                    </div>
                                                )}
                                                {!prov.usa_precio_proveedor && (
                                                    <div className="text-[10px] text-gray-400 font-normal italic">Estándar</div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="text-sm font-bold text-emerald-600">
                                            {formulacion.materia_prima_costo_unitario ?? 0}
                                        </div>
                                    );
                                })()}
                                </td>

                                {/* COSTO TOTAL */}
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                {(() => {
                                    if (costoOverride) {
                                        return (
                                            <div>
                                                <div className="text-sm font-bold text-amber-600">
                                                    {fmtCOP(costoOverride.costo_total)}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-normal italic tracking-tighter">
                                                    <span className="line-through">
                                                        $ {recalculatedData == null
                                                            ? formulacion.costo_total_materia
                                                            : formulacion.costo_total_materia_recalculado ?? 0}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    }
                                    const prov = proveedorMap[formulacion.item_general_id];
                                    if (prov) {
                                        return (
                                            <div>
                                                <div className={`text-sm font-bold ${prov.usa_precio_proveedor ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    $ {prov.costo_total_proveedor}
                                                </div>
                                                {prov.usa_precio_proveedor && (
                                                    <div className="text-[10px] text-gray-400 font-normal italic tracking-tighter">
                                                        <span className="line-through">$ {prov.costo_total_estandar}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="text-sm font-bold text-emerald-600">
                                            {recalculatedData == null ? formulacion.costo_total_materia : formulacion.costo_total_materia_recalculado ?? 0}
                                            {recalculatedData && (
                                                <div className="text-[10px] text-gray-500 font-normal italic tracking-tighter">
                                                    Base: {formulacion.costo_total_materia ?? 0}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                                </td>
                            </tr>
                            );
                            })
                        ) : (
                            <tr>
                            <td colSpan="6" className="text-center py-10 text-gray-400 text-xs uppercase font-bold tracking-widest bg-zinc-50">
                                No hay componentes disponibles en esta formulación.
                            </td>
                            </tr>
                        )
                        }
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <div className="flex justify-end items-center">
                    <div className="flex gap-6 flex-wrap">
                        <div className="text-sm flex items-center gap-1.5">
                            <span className="text-gray-600 font-medium">Total Cantidad: </span>
                            {isLoading
                                ? <div className="h-3 w-10 bg-zinc-200 rounded animate-pulse inline-block" />
                                : <span className={`font-bold ${recalculatedData ? 'text-green-600' : 'text-blue-600'}`}>
                                    {!recalculatedData ? productDetail?.costos?.total_cantidad_materia_prima : recalculatedData?.recalculados?.total_cantidad_materia_prima}
                                  </span>
                            }
                        </div>
                        <div className="text-sm border-l border-gray-200 pl-6 flex items-center gap-1.5">
                            <span className="text-gray-600 font-medium">Total Costo MP: </span>
                            {isLoading
                                ? <div className="h-3 w-20 bg-zinc-200 rounded animate-pulse inline-block" />
                                : <span className={`font-bold ${recalculatedData ? 'text-green-600' : 'text-emerald-600'}`}>
                                    $ {!recalculatedData ? productDetail?.costos?.total_costo_materia_prima : recalculatedData?.recalculados?.total_costo_materia_prima}
                                  </span>
                            }
                        </div>
                        {hasAnyOverride && totalCostoOverride && (
                            <div className="text-sm border-l border-gray-200 pl-6">
                                <span className="text-amber-600 font-medium flex items-center gap-1 inline-flex">
                                    <Truck size={12} /> Selección:
                                </span>{' '}
                                <span className="font-bold text-amber-700">
                                    {fmtCOP(totalCostoOverride)}
                                </span>
                            </div>
                        )}
                        {costosProveedor && (
                            <div className="text-sm border-l border-gray-200 pl-6">
                                <span className="text-amber-600 font-medium flex items-center gap-1 inline-flex">
                                    <Truck size={12} /> Proveedor:
                                </span>{' '}
                                <span className="font-bold text-amber-700">
                                    $ {costosProveedor.costos_proveedor?.total_costo_materia_prima}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
