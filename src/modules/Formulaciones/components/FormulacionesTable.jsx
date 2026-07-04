import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FlaskConical, Beaker, Scale, DollarSign, Truck, ChevronDown, X, Pencil, Copy, AlertTriangle, Layers, ClipboardList } from 'lucide-react';

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
      <span className="text-[9px] text-content-muted italic">Sin proveedores</span>
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
            ? 'bg-semantic-warning-subtle border-semantic-warning/20 text-semantic-warning-fg hover:bg-semantic-warning-subtle'
            : 'bg-surface-subtle border-border-base text-content-tertiary hover:bg-surface-muted'
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
          className="text-content-muted hover:text-semantic-danger transition-colors ml-0.5"
        >
          <X size={9} />
        </button>
      )}

      {open && createPortal(
        <div
          ref={dropRef}
          className="fixed z-[9999] bg-surface-base border border-border-base rounded-lg shadow-xl overflow-hidden"
          style={{ top: coords.top, left: coords.left, width: coords.width }}
        >
          <div className="px-2 py-1.5 bg-surface-subtle border-b border-border-subtle">
            <p className="text-[9px] font-bold text-content-tertiary uppercase tracking-widest">Proveedores vinculados</p>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {opciones.map((op) => (
              <button
                key={op.id_item_proveedor}
                type="button"
                onClick={() => { onSelect(op.id_item_proveedor); setOpen(false); }}
                className={`w-full text-left px-2.5 py-2 hover:bg-semantic-warning-subtle transition-colors flex items-center justify-between gap-2 ${
                  op.id_item_proveedor === selectedId ? 'bg-semantic-warning-subtle' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-content-primary truncate">{op.nombre_empresa}</p>
                  <p className="text-[9px] text-content-muted truncate">{op.nombre_item}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-bold text-semantic-warning-fg">{fmtCOP(op.precio_por_kg)}/kg</p>
                  {op.unidad_compra && (
                    <p className="text-[9px] text-content-muted">{fmtCOP(op.precio_unitario)}/{op.unidad_compra}</p>
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
                total += Number(
                  recalculatedData
                    ? (f.costo_total_materia_recalculado ?? f.costo_total_materia)
                    : f.costo_total_materia
                ) || 0;
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
                            <div className="text-xs text-content-inverse overflow-hidden truncate w-40">
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
                                const esFase = formulacion.tipo === 'fase';
                                return (
                                    <tr key={`linea-${index}`}>
                                        <td colSpan="7" className={`px-4 py-2 ${esFase
                                            ? 'tbl-header'
                                            : 'bg-semantic-info-subtle/60 text-semantic-info-fg border-y border-semantic-info/15'}`}>
                                            <div className="flex items-center gap-2">
                                                {esFase
                                                    ? <Layers size={13} className="shrink-0" />
                                                    : <ClipboardList size={13} className="shrink-0" />}
                                                <span className={`text-xs ${esFase ? 'font-bold uppercase tracking-wide' : 'font-medium italic'}`}>
                                                    {formulacion.texto || (esFase ? 'Fase' : 'Instrucción')}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }

                            return (
                            <tr key={`formulacion-row-${index}`} className={`transition-colors ${costoOverride ? 'bg-semantic-warning-subtle/40 hover:bg-semantic-warning-subtle/70' : 'hover:bg-surface-subtle'}`}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-content-primary">
                                {index + 1}
                                </td>

                                {/* MATERIA PRIMA + SELECTOR PROVEEDOR */}
                                <td className="px-3 py-2">
                                <div className="flex items-center">
                                    <div className={`shrink-0 h-7 w-7 rounded-full bg-surface-base flex items-center justify-center shadow-inner ${tieneProveedor || esAgua ? 'border border-semantic-info/20' : 'border border-semantic-warning/40'}`}>
                                    {tieneProveedor || esAgua
                                        ? <Beaker className="h-4 w-4 text-semantic-info-fg" />
                                        : <AlertTriangle className="h-3.5 w-3.5 text-semantic-warning-fg" />
                                    }
                                    </div>
                                    <div className="ml-3 min-w-0">
                                    <div className="text-xs font-semibold text-content-primary uppercase tracking-tight">
                                        {formulacion.materia_prima_nombre || 'Sin nombre'}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                        <span className="text-xs text-semantic-info-fg font-medium">
                                            {formulacion.materia_prima_codigo || 'Sin código'}
                                        </span>
                                        {formulacion.nota && (
                                            <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-muted text-content-secondary border border-border-base">
                                                {formulacion.nota}
                                            </span>
                                        )}
                                        {opciones.length > 0 && onSeleccionIngrediente ? (
                                            <IngredienteProveedorSelect
                                                opciones={opciones}
                                                selectedId={seleccionPorIngrediente[mpId] ?? null}
                                                onSelect={(ipId) => handleSelectProveedor(mpId, ipId)}
                                            />
                                        ) : esAgua ? (
                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-semantic-info-subtle text-semantic-info-fg border border-semantic-info/20">
                                                Costo interno
                                            </span>
                                        ) : onSeleccionIngrediente && (
                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-semantic-danger-subtle text-semantic-danger-fg border border-semantic-danger/20">
                                                <AlertTriangle size={9} /> Sin proveedor
                                            </span>
                                        )}
                                    </div>
                                    </div>
                                </div>
                                </td>

                                {/* CANTIDAD */}
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                <div className={`text-sm font-bold ${recalculatedData ? 'text-semantic-success-fg' : 'text-semantic-info-fg'}`}>
                                    {recalculatedData == null ? formulacion.cantidad : formulacion.cantidad_recalculada ?? 0}
                                    {recalculatedData && (
                                        <div className="text-[10px] text-content-tertiary font-normal italic tracking-tighter">
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
                                        <div className={`text-sm font-bold ${suficiente ? 'text-semantic-success-fg' : 'text-semantic-danger-fg'}`}>
                                            {formulacion.inventario_cantidad ?? 0}
                                            <div className={`text-[10px] font-normal ${suficiente ? 'text-semantic-success' : 'text-semantic-danger'}`}>
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
                                                <div className="text-sm font-bold text-semantic-warning-fg">
                                                    {fmtCOP(costoOverride.costo_unitario)}
                                                </div>
                                                <div className="text-[10px] text-content-muted font-normal italic tracking-tighter flex items-center justify-center gap-0.5">
                                                    <Truck size={8} /> {costoOverride.nombre_empresa}
                                                </div>
                                            </div>
                                        );
                                    }
                                    const prov = proveedorMap[formulacion.item_general_id];
                                    if (prov) {
                                        return (
                                            <div>
                                                <div className={`text-sm font-bold ${prov.usa_precio_proveedor ? 'text-semantic-warning-fg' : 'text-semantic-success-fg'}`}>
                                                    $ {prov.costo_unitario_efectivo}
                                                </div>
                                                {prov.usa_precio_proveedor && (
                                                    <div className="text-[10px] text-content-muted font-normal italic tracking-tighter flex items-center justify-center gap-0.5">
                                                        <Truck size={8} /> Prov.
                                                        <span className="ml-1 line-through">$ {prov.costo_unitario_estandar}</span>
                                                    </div>
                                                )}
                                                {!prov.usa_precio_proveedor && (
                                                    <div className="text-[10px] text-content-muted font-normal italic">Estándar</div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="text-sm font-bold text-semantic-success-fg">
                                            {formulacion.materia_prima_costo_unitario ?? 0}
                                        </div>
                                    );
                                })()}
                                </td>

                                {/* ÚLTIMO PRECIO (informativo, capa más reciente) */}
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                {(() => {
                                    const ultimoPrecio = getUltimoPrecio(formulacion);
                                    return ultimoPrecio
                                        ? <span className="text-sm font-medium text-content-secondary">{fmtCOP(ultimoPrecio)}</span>
                                        : <span className="text-sm text-content-muted">—</span>;
                                })()}
                                </td>

                                {/* COSTO TOTAL */}
                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                {(() => {
                                    if (costoOverride) {
                                        return (
                                            <div>
                                                <div className="text-sm font-bold text-semantic-warning-fg">
                                                    {fmtCOP(costoOverride.costo_total)}
                                                </div>
                                                <div className="text-[10px] text-content-muted font-normal italic tracking-tighter">
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
                                                <div className={`text-sm font-bold ${prov.usa_precio_proveedor ? 'text-semantic-warning-fg' : 'text-semantic-success-fg'}`}>
                                                    $ {prov.costo_total_proveedor}
                                                </div>
                                                {prov.usa_precio_proveedor && (
                                                    <div className="text-[10px] text-content-muted font-normal italic tracking-tighter">
                                                        <span className="line-through">$ {prov.costo_total_estandar}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="text-sm font-bold text-semantic-success-fg">
                                            {recalculatedData == null ? formulacion.costo_total_materia : formulacion.costo_total_materia_recalculado ?? 0}
                                            {recalculatedData && (
                                                <div className="text-[10px] text-content-tertiary font-normal italic tracking-tighter">
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
