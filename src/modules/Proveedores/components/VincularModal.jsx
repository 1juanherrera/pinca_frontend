import { useState, useEffect } from 'react';
import { Link2, Plus, X, ArrowRight, Info, AlertCircle } from 'lucide-react';
import { useProveedores } from '../api/useProveedores';
import { useUnidades } from '../../../api/useUnidades';
import { useBodegas } from '../../Bodegas/api/useBodegas';
import { FormSelect } from '../../../shared/Form/FormSelect';
import ItemGeneralSearch from '../../../shared/ItemGeneralSearch';

const KILO_NOMBRE = 'KILO';

const VincularModal = ({ item, onClose }) => {
  const { vincularAsync, isVinculando } = useProveedores();
  const { unidades } = useUnidades();
  const { bodegas }  = useBodegas();

  const [modo,             setModo]            = useState('existente');
  const [selectedItem,     setSelectedItem]    = useState(null);
  const [unidadCompraId,   setUnidadCompraId]  = useState('');
  const [factorConversion, setFactorConversion]= useState(1);
  const [bodegaId,         setBodegaId]        = useState('');
  const [cantidad,         setCantidad]        = useState('');

  const [nuevoNombre, setNuevoNombre] = useState(item.nombre ?? '');
  const [nuevoCodigo, setNuevoCodigo] = useState(item.codigo ?? '');
  const [nuevoTipo,   setNuevoTipo]   = useState('2');

  const unidadOptions = unidades.map((u) => ({
    value: String(u.id_unidad),
    label: u.nombre,
  }));

  const unidadSeleccionada = unidades.find(u => String(u.id_unidad) === String(unidadCompraId));
  const esKilo = unidadSeleccionada?.nombre === KILO_NOMBRE;

  useEffect(() => {
    if (!unidadSeleccionada) return;
    setFactorConversion(Number(unidadSeleccionada.escala) || 1);
  }, [unidadCompraId]);

  const esValido = modo === 'existente'
    ? !!selectedItem
    : nuevoNombre.trim().length >= 2;

  const handleConfirm = async () => {
    if (!esValido) return;

    const payload =
      modo === 'existente'
        ? { item_general_id: selectedItem.id_item_general }
        : { crear: true, nombre: nuevoNombre, codigo: nuevoCodigo, tipo: nuevoTipo };

    if (unidadCompraId) {
      payload.unidad_compra_id   = parseInt(unidadCompraId, 10);
      payload.factor_conversion  = Number(factorConversion) || 1;
    }

    if (bodegaId && cantidad) {
      payload.bodegas_id = bodegaId;
      payload.cantidad   = parseFloat(cantidad);
    }

    await vincularAsync({ id: item.id_item_proveedor, data: payload });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-border-subtle">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface-subtle">
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-content-tertiary" />
            <div>
              <h2 className="text-sm font-bold text-content-primary uppercase tracking-wide">Vincular ítem</h2>
              <p className="text-[10px] text-content-muted mt-0.5 uppercase">{item.nombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-white hover:border-content-primary transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Info del producto del proveedor */}
          <div className="flex items-start gap-3 bg-surface-subtle border border-border-base rounded-lg px-3 py-2.5">
            <Info size={14} className="text-content-muted mt-0.5 shrink-0" />
            <div className="text-[10px] text-content-tertiary space-y-0.5">
              <p><span className="font-bold text-content-secondary">Código:</span> {item.codigo ?? '—'}</p>
              <p><span className="font-bold text-content-secondary">Proveedor:</span> {item.nombre_empresa}</p>
              <p><span className="font-bold text-content-secondary">Precio unit.:</span> ${item.precio_unitario?.toLocaleString('es-CO')}</p>
            </div>
          </div>

          {/* Selector de modo */}
          <div className="flex gap-2">
            <button
              onClick={() => setModo('existente')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                modo === 'existente'
                  ? 'bg-content-primary text-white border-content-primary'
                  : 'bg-white text-content-tertiary border-border-base hover:border-border-strong'
              }`}
            >
              Buscar ítem existente
            </button>
            <button
              onClick={() => setModo('nuevo')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold border transition-all ${
                modo === 'nuevo'
                  ? 'bg-content-primary text-white border-content-primary'
                  : 'bg-white text-content-tertiary border-border-base hover:border-border-strong'
              }`}
            >
              <Plus size={12} /> Crear ítem nuevo
            </button>
          </div>

          {/* Modo: buscar existente con fuzzy search */}
          {modo === 'existente' && (
            <ItemGeneralSearch
              value={selectedItem}
              onChange={setSelectedItem}
              label="Materia prima interna"
              autoSearch={item.nombre}
              placeholder="Buscar por nombre o código..."
              precioActual={item.precio_unitario ?? 0}
            />
          )}

          {/* Modo: crear nuevo */}
          {modo === 'nuevo' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1.5">Nombre *</label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition text-content-secondary uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1.5">Código</label>
                  <input
                    type="text"
                    value={nuevoCodigo}
                    onChange={(e) => setNuevoCodigo(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition text-content-secondary"
                  />
                </div>
                <FormSelect
                  label="Tipo"
                  options={[
                    { value: '0', label: 'Producto'      },
                    { value: '1', label: 'Materia Prima' },
                    { value: '2', label: 'Insumo'        },
                  ]}
                  value={nuevoTipo}
                  onChange={setNuevoTipo}
                />
              </div>
            </div>
          )}

          {/* ── Unidad de compra + factor ── solo cuando hay ítem seleccionado */}
          {(selectedItem || modo === 'nuevo') && (
            <div className="rounded-xl border border-border-base bg-surface-subtle px-4 py-3 space-y-3">
              <p className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
                Unidad de compra al proveedor
              </p>
              <div className="grid grid-cols-2 gap-3">
                <FormSelect
                  label="El proveedor vende en"
                  options={unidadOptions}
                  value={unidadCompraId}
                  onChange={setUnidadCompraId}
                  placeholder="Selecciona unidad..."
                />
                <div>
                  <label className="block text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1.5">
                    Factor → KG
                  </label>
                  <input
                    type="number"
                    min="0.000001"
                    step="0.001"
                    value={factorConversion}
                    onChange={e => setFactorConversion(e.target.value)}
                    disabled={esKilo}
                    className="w-full px-3 py-2 text-sm font-mono border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {unidadSeleccionada && !esKilo && (
                <div className="flex items-center gap-1.5 text-[10px] text-semantic-warning-fg">
                  <AlertCircle size={11} />
                  1 {unidadSeleccionada.nombre} = {factorConversion} {item.unidad_almacenaje_nombre ?? 'unidades base'} en inventario
                </div>
              )}
              {esKilo && (
                <p className="text-[10px] text-semantic-success-fg">Unidad base — sin conversión necesaria.</p>
              )}
            </div>
          )}

          {/* Ingreso a inventario (opcional) */}
          <div className="border-t border-border-subtle pt-4 space-y-3">
            <p className="text-[10px] font-bold text-content-muted uppercase tracking-widest">
              Ingresar al inventario <span className="font-normal normal-case">(opcional)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormSelect
                label="Bodega destino"
                placeholder="Selecciona bodega..."
                options={(bodegas ?? []).map(b => ({ value: b.id_bodegas, label: b.nombre }))}
                value={bodegaId}
                onChange={setBodegaId}
              />
              <div>
                <label className="block text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1.5">Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition text-content-secondary placeholder:text-content-muted"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-content-tertiary border border-border-base rounded-lg hover:bg-surface-muted transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!esValido || isVinculando}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 ${
              !esValido || isVinculando
                ? 'bg-surface-strong text-content-muted cursor-not-allowed'
                : 'bg-content-primary text-white hover:bg-content-secondary'
            }`}
          >
            <ArrowRight size={13} />
            {isVinculando ? 'Vinculando...' : 'Confirmar vínculo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VincularModal;
