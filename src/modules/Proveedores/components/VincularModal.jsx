import { useState } from 'react';
import { Link2, Plus, X, ArrowRight, Info, AlertCircle } from 'lucide-react';
import { useProveedores } from '../api/useProveedores';
import { useUnidades } from '../../../api/useUnidades';
import { FormSelect } from '../../../shared/Form/FormSelect';
import ItemGeneralSearch from '../../../shared/ItemGeneralSearch';

const KILO_NOMBRE = 'KILO';

const VincularModal = ({ item, onClose }) => {
  const { vincularAsync, isVinculando } = useProveedores();
  const { unidades } = useUnidades();

  const [modo,             setModo]            = useState('existente');
  const [selectedItem,     setSelectedItem]    = useState(null);
  const [unidadCompraId,   setUnidadCompraId]  = useState('');
  const [factorConversion, setFactorConversion]= useState(1);

  const [nuevoNombre, setNuevoNombre] = useState(item.nombre ?? '');
  const [nuevoCodigo, setNuevoCodigo] = useState(item.codigo ?? '');
  const [nuevoTipo,   setNuevoTipo]   = useState('2');

  const unidadOptions = unidades.map((u) => ({
    value: String(u.id_unidad),
    label: u.nombre,
  }));

  const unidadSeleccionada = unidades.find(u => String(u.id_unidad) === String(unidadCompraId));
  const esKilo = unidadSeleccionada?.nombre === KILO_NOMBRE;

  // Al cambiar unidad de compra, reseteamos el factor a la escala default de esa unidad
  const handleUnidadChange = (newId) => {
    setUnidadCompraId(newId);
    const u = unidades.find(x => String(x.id_unidad) === String(newId));
    if (u) setFactorConversion(Number(u.escala) || 1);
  };

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

    await vincularAsync({ id: item.id_item_proveedor, data: payload });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[110]">
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

        <div className="p-5 space-y-4 min-h-[60vh] max-h-[85vh] overflow-y-auto">

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
                  onChange={handleUnidadChange}
                  placeholder="Selecciona unidad..."
                />
                <div className="relative group">
                  <label className="flex items-center gap-1 text-[10px] font-bold text-content-muted uppercase tracking-widest mb-1.5">
                    Factor → KG
                    <Info size={10} className="text-content-muted group-hover:text-content-secondary cursor-help" />
                  </label>
                  <input
                    type="number"
                    min="0.000001"
                    step="0.001"
                    value={factorConversion}
                    onChange={e => setFactorConversion(e.target.value)}
                    disabled={esKilo}
                    placeholder={esKilo ? '1' : (unidadSeleccionada ? `Ej: 25 si 1 ${unidadSeleccionada.nombre} = 25 kg` : 'Ej: 25')}
                    className="w-full px-3 py-2 text-sm font-mono border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  {/* Tooltip al hacer hover en el label */}
                  <div className="hidden group-hover:block absolute left-0 top-full mt-1 z-50 w-56 p-2.5 bg-content-primary text-white text-[10px] rounded-lg shadow-xl">
                    <p className="font-bold mb-1">Factor de conversión</p>
                    <p className="text-white/80 mb-1.5 leading-snug">Cuántos kg hay en 1 unidad de compra del proveedor.</p>
                    <div className="bg-white/10 rounded px-2 py-1 font-mono">
                      1 BULTO = 25 kg → Factor = <strong>25</strong>
                    </div>
                  </div>
                </div>
              </div>

              {unidadSeleccionada && !esKilo && (
                <div className="flex items-center gap-1.5 text-[10px] text-semantic-info-fg bg-semantic-info-subtle border border-semantic-info/15 rounded-lg px-2.5 py-1.5">
                  <AlertCircle size={11} />
                  Conversión: 1 {unidadSeleccionada.nombre} = <strong>{factorConversion} {item.unidad_almacenaje_nombre ?? 'kg'}</strong> en inventario
                </div>
              )}
              {esKilo && (
                <p className="text-[10px] text-semantic-success-fg">Unidad base — sin conversión necesaria.</p>
              )}
            </div>
          )}

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
