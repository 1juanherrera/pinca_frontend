import { useState, useMemo } from 'react';
import { Link2, Plus, Search, X, ArrowRight, Info, Check } from 'lucide-react';
import { useProveedores } from '../api/useProveedores';
import { useItem } from '../../Inventario/api/useItem';
import { useBodegas } from '../../Bodegas/api/useBodegas';
import { FormSelect } from '../../../shared/Form/FormSelect';

const VincularModal = ({ item, onClose }) => {
  const { vincularAsync, isVinculando } = useProveedores();
  const { items: itemsGenerales }       = useItem();
  const { bodegas }                     = useBodegas();

  const [modo,          setModo]          = useState('existente'); // 'existente' | 'nuevo'
  const [searchItem,    setSearchItem]    = useState('');
  const [selectedItem,  setSelectedItem]  = useState(null);
  const [bodegaId,      setBodegaId]      = useState('');
  const [cantidad,      setCantidad]      = useState('');

  // Campos para crear ítem nuevo
  const [nuevoNombre,   setNuevoNombre]   = useState(item.nombre ?? '');
  const [nuevoCodigo,   setNuevoCodigo]   = useState(item.codigo ?? '');
  const [nuevoTipo,     setNuevoTipo]     = useState('2');
  const [nuevoUnidad,   setNuevoUnidad]   = useState('');

  const itemsFiltrados = useMemo(() => {
    if (!searchItem) return itemsGenerales.slice(0, 10);
    const q = searchItem.toLowerCase();
    return itemsGenerales.filter(
      (i) => i.nombre?.toLowerCase().includes(q) || i.codigo?.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [itemsGenerales, searchItem]);

  const bodegaOptions = useMemo(() =>
    (bodegas ?? []).map((b) => ({ value: b.id_bodegas, label: b.nombre })),
  [bodegas]);

  const esValido = modo === 'existente'
    ? !!selectedItem
    : nuevoNombre.trim().length >= 2;

  const handleConfirm = async () => {
    if (!esValido) return;

    const payload =
      modo === 'existente'
        ? { item_general_id: selectedItem.id_item_general }
        : { crear: true, nombre: nuevoNombre, codigo: nuevoCodigo, tipo: nuevoTipo, unidad_id: nuevoUnidad || null };

    if (bodegaId && cantidad) {
      payload.bodegas_id = bodegaId;
      payload.cantidad   = parseFloat(cantidad);
    }

    await vincularAsync({ id: item.id_item_proveedor, data: payload });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-zinc-100">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50">
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-zinc-500" />
            <div>
              <h2 className="text-sm font-bold text-zinc-800 uppercase tracking-wide">Vincular ítem</h2>
              <p className="text-[10px] text-zinc-400 mt-0.5">{item.nombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Info del producto del proveedor */}
          <div className="flex items-start gap-3 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5">
            <Info size={14} className="text-zinc-400 mt-0.5 shrink-0" />
            <div className="text-[10px] text-zinc-500 space-y-0.5">
              <p><span className="font-bold text-zinc-700">Código:</span> {item.codigo ?? '—'}</p>
              <p><span className="font-bold text-zinc-700">Proveedor:</span> {item.nombre_empresa}</p>
              <p><span className="font-bold text-zinc-700">Precio unit.:</span> ${item.precio_unitario?.toLocaleString('es-CO')}</p>
            </div>
          </div>

          {/* Selector de modo */}
          <div className="flex gap-2">
            <button
              onClick={() => setModo('existente')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${
                modo === 'existente'
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              <Search size={12} /> Buscar ítem existente
            </button>
            <button
              onClick={() => setModo('nuevo')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition-all ${
                modo === 'nuevo'
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
              }`}
            >
              <Plus size={12} /> Crear ítem nuevo
            </button>
          </div>

          {/* Modo: buscar existente */}
          {modo === 'existente' && (
            <div className="space-y-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 transition placeholder:text-zinc-300"
                />
              </div>

              <div className="max-h-44 overflow-y-auto rounded-lg border border-zinc-100 divide-y divide-zinc-50">
                {itemsFiltrados.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-4">Sin resultados</p>
                ) : itemsFiltrados.map((ig) => (
                  <button
                    key={ig.id_item_general}
                    onClick={() => setSelectedItem(ig)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-zinc-50 transition-colors ${
                      selectedItem?.id_item_general === ig.id_item_general ? 'bg-emerald-50' : ''
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-zinc-800">{ig.nombre}</p>
                      <p className="text-[10px] text-zinc-400 ">{ig.codigo}</p>
                    </div>
                    {selectedItem?.id_item_general === ig.id_item_general && (
                      <Check size={14} className="text-emerald-600 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Modo: crear nuevo */}
          {modo === 'nuevo' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Nombre *</label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 transition text-zinc-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Código</label>
                  <input
                    type="text"
                    value={nuevoCodigo}
                    onChange={(e) => setNuevoCodigo(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 transition text-zinc-700"
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

          {/* Ingreso a inventario (opcional) */}
          <div className="border-t border-zinc-100 pt-4 space-y-3">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Ingresar al inventario <span className="font-normal normal-case">(opcional)</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FormSelect
                label="Bodega destino"
                placeholder="Selecciona bodega..."
                options={bodegaOptions}
                value={bodegaId}
                onChange={setBodegaId}
              />
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 transition text-zinc-700 placeholder:text-zinc-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-zinc-500 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!esValido || isVinculando}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 ${
              !esValido || isVinculando
                ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                : 'bg-zinc-900 text-white hover:bg-zinc-700'
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