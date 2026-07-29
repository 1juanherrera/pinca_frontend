import { useState, useMemo } from 'react';
import { Search, Trophy, History, PackageSearch, PackageOpen, X } from 'lucide-react';
import { useComparadorPorItem } from '../api/useComparador';
import { fmt } from '../../../utils/formatters';

const Stat = ({ label, value, isMejor }) => (
  <div className={`flex items-center justify-between p-2.5 rounded-lg border ${isMejor ? 'bg-semantic-success-subtle/50 border-semantic-success/15' : 'bg-surface-subtle border-border-subtle'}`}>
    <span className="text-[10px] font-bold text-content-muted uppercase tracking-widest">{label}</span>
    <div className="flex items-center gap-1.5">
      {isMejor && <Trophy size={10} className="text-semantic-success" />}
      <span className={`text-xs  font-bold ${isMejor ? 'text-semantic-success-fg' : 'text-content-secondary'}`}>
        {value ? fmt(value) : '—'}
      </span>
    </div>
  </div>
);

const PorProductoView = ({ onHistorial }) => {
  const { grupos } = useComparadorPorItem();
  const [search, setSearch] = useState('');
  // Guardar solo el nombre del grupo seleccionado y derivar el objeto de `grupos`
  // en render: si el comparador refetchea (cambian precios), la vista muestra los
  // datos frescos en vez de un snapshot congelado al momento de seleccionar.
  const [selectedNombre, setSelectedNombre] = useState(null);
  const selectedGrupo = selectedNombre
    ? (grupos.find((g) => g.nombre === selectedNombre) ?? null)
    : null;

  const filteredGrupos = useMemo(() => {
    if (!search || search.length < 2) return [];
    const q = search.toLowerCase();
    return grupos
      .filter((g) => g.nombre?.toLowerCase().includes(q) || g.item_general_nombre?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [grupos, search]);

  const selectGrupo = (grupo) => {
    setSelectedNombre(grupo.nombre);
    setSearch('');
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Buscador */}
      <div className="bg-surface-base border border-border-subtle rounded-2xl px-5 py-4 shadow-sm relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Busca un producto para comparar sus proveedores (ej: Resina)..."
              className="w-full pl-8 pr-3 py-2.5 text-xs border border-border-base rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 transition placeholder:text-content-muted bg-surface-base"
            />
            {filteredGrupos.length > 0 && (
              <div className="absolute top-full mt-2 left-0 right-0 z-30 bg-surface-base border border-border-subtle rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
                {filteredGrupos.map((grupo, i) => (
                  <button
                    key={i}
                    onClick={() => selectGrupo(grupo)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-subtle transition-colors text-left border-b border-border-subtle last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center">
                        <PackageSearch size={14} className="text-content-tertiary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-content-primary truncate">{grupo.nombre}</p>
                        <p className="text-[10px] text-content-muted mt-0.5">
                          {grupo.tipo} · {grupo.proveedores.length} proveedor{grupo.proveedores.length !== 1 ? 'es' : ''}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedGrupo && (
            <button
              onClick={() => setSelectedNombre(null)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-semantic-danger border border-semantic-danger/15 bg-semantic-danger-subtle rounded-xl hover:bg-semantic-danger-subtle transition whitespace-nowrap"
            >
              <X size={14} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Resultados */}
      {!selectedGrupo ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center bg-surface-base border border-border-subtle rounded-2xl shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-surface-subtle flex items-center justify-center border border-border-subtle">
            <PackageOpen size={24} className="text-content-muted" />
          </div>
          <p className="text-sm font-bold text-content-primary">Selecciona un producto</p>
          <p className="text-xs text-content-muted max-w-sm">Busca un producto en la barra superior para ver y comparar todos los proveedores que lo ofrecen.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="bg-content-primary rounded-2xl px-5 py-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-content-inverse/60 uppercase tracking-widest mb-1">Comparando producto</p>
              <h2 className="text-base font-bold text-content-inverse">{selectedGrupo.nombre}</h2>
              <p className="text-xs text-content-inverse/60 mt-0.5">{selectedGrupo.proveedores.length} opciones disponibles</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-content-inverse/60 uppercase tracking-widest mb-1">Mejor Precio</p>
              <p className="text-lg font-bold text-semantic-success/80 tabular-nums">{fmt(selectedGrupo.precio_min)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {selectedGrupo.proveedores.map((prov) => {
              const esMejorPrecio = prov.precio_unitario === selectedGrupo.precio_min;
              return (
                <div key={prov.id_item_proveedor} className={`relative flex flex-col bg-surface-base border rounded-2xl overflow-hidden shadow-sm transition-all ${esMejorPrecio ? 'border-semantic-success/20 ring-2 ring-semantic-success/20' : 'border-border-base hover:border-border-strong'}`}>
                  <div className={`h-1.5 w-full ${esMejorPrecio ? 'bg-semantic-success' : 'bg-semantic-info'}`} />
                  
                  <div className="px-5 pt-4 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-content-primary leading-snug">{prov.nombre_empresa || prov.nombre_encargado}</p>
                        <p className="text-[10px]  text-content-muted mt-1">Cód: {prov.codigo}</p>
                      </div>
                      <button
                        onClick={() => onHistorial(prov)}
                        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-xl border border-border-base text-content-muted hover:bg-content-primary hover:text-content-inverse hover:border-content-primary transition-all"
                        title="Ver historial de precios"
                      >
                        <History size={13} />
                      </button>
                    </div>
                    {esMejorPrecio && (
                      <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-semantic-success-subtle text-semantic-success-fg">
                        <Trophy size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Opción más rentable</span>
                      </div>
                    )}
                  </div>

                  <div className="px-5 pb-5 grid grid-cols-1 gap-2 mt-auto">
                    <Stat label="Precio Unitario" value={prov.precio_unitario} isMejor={esMejorPrecio} />
                    <Stat label="Precio con IVA" value={prov.precio_con_iva} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PorProductoView;
