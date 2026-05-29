import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Beaker, ChevronDown, Loader2, Check, 
  Eraser, Package, Search as SearchIcon 
} from 'lucide-react';

export const ProductSelect = ({
  formulaciones = [],
  selectedProduct,
  onProductSelect,
  loading = false,
  onClearSelection
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownStyles, setDropdownStyles] = useState({});
  
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // 1. Lógica de apertura y posicionamiento
  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyles({
        position: 'fixed',
        top: `${rect.bottom + 4}px`, // Pegadito al input
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 999999,
      });
      setIsOpen(true);
      setSearchTerm('');
    }
  };

  // 2. CORRECCIÓN DE SCROLL: Solo cerrar si se scrollea fuera del portal
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && !triggerRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleScroll = (e) => {
      // Si el scroll viene de dentro de la lista, NO cerrar
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      if (isOpen) setIsOpen(false);
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true); // Captura el scroll del modal/página

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const filtered = formulaciones.filter(f => 
    f.nombre_item_general?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.codigo_item_general?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentProduct = formulaciones.find(f => String(f.id_item_general) === String(selectedProduct));

  return (
    // ESTILOS EXTERIORES ORIGINALES (px-4 py-3)
    <div className="bg-surface-base border border-border-base/60 rounded-xl px-4 py-3 shadow-sm transition-all hover:border-border-strong w-full">
      
      {/* Cabecera Compacta Original */}
      <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
              <div className="p-1 bg-semantic-info-subtle text-semantic-info-fg rounded-md border border-semantic-info/15">
                  <Beaker size={14} />
              </div>
              <h3 className="text-[10px] font-bold text-content-muted uppercase tracking-wider leading-none">
                  Seleccionar Item
              </h3>
          </div>

          {selectedProduct && (
              <button
                  onClick={onClearSelection}
                  className="flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-content-muted hover:text-semantic-danger hover:bg-semantic-danger-subtle rounded transition-all uppercase tracking-tight"
              >
                  <Eraser size={11}/>
                  Limpiar
              </button>
          )}
      </div>

      {/* Trigger de Búsqueda */}
      <div className="relative group w-full">
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isOpen ? 'text-semantic-info' : 'text-content-muted'}`}>
              <SearchIcon size={14} />
          </div>
          
          <button
              ref={triggerRef}
              type="button"
              onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
              className={`w-full pl-9 pr-8 py-1.5 text-left bg-surface-subtle border rounded-lg text-xs font-medium transition-all appearance-none truncate
                ${isOpen ? 'border-semantic-info bg-surface-base ring-2 ring-semantic-info/10' : 'border-border-base text-content-tertiary'}
              `}
          >
              {currentProduct ? `${currentProduct.codigo_item_general} — ${currentProduct.nombre}` : 'Buscar producto o insumo...'}
          </button>

          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-content-muted">
              <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
      </div>

      {/* Info Box Compacto Original */}
      {selectedProduct && currentProduct && !isOpen && (
          <div className="mt-2.5 flex items-center gap-2.5 p-2 bg-surface-subtle/80 border border-border-base/80 rounded-lg animate-in fade-in slide-in-from-top-1">
              <div className="w-6 h-6 rounded-md bg-surface-base border border-border-base flex items-center justify-center text-semantic-info-fg shadow-sm shrink-0">
                  <Package size={13} />
              </div>
              <div>
                  <p className="text-[9px] font-bold text-content-muted uppercase leading-none mb-0.5">Item Seleccionado</p>
                  <p className="text-xs font-semibold text-content-primary tracking-tight leading-none">
                      ✓ {currentProduct.nombre}
                  </p>
              </div>
          </div>
      )}

      {/* PORTAL CON SCROLL CORREGIDO */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={dropdownStyles}
          className="bg-surface-base border border-border-base rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-100 flex flex-col"
        >
          {/* Input de búsqueda interno */}
          <div className="p-2 border-b border-border-subtle bg-surface-subtle">
            <input 
              autoFocus
              placeholder="Filtrar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border-base rounded-md focus:outline-none focus:border-semantic-info"
            />
          </div>

          {/* LISTA CON SCROLL REAL */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length > 0 ? (
              filtered.map((f) => (
                <button
                  key={f.id_formulacion}
                  onClick={() => {
                    onProductSelect(f.id_item_general);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-4 py-2 text-xs text-left transition-colors
                    ${String(selectedProduct) === String(f.id_item_general) 
                      ? 'bg-semantic-info-subtle text-semantic-info-fg font-bold' 
                      : 'text-content-secondary hover:bg-surface-muted font-bold'}
                  `}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] text-semantic-info  leading-none mb-1">
                        {f.codigo_item_general}
                    </span>
                    <span className="uppercase">{f.nombre}</span>
                  </div>
                  {String(selectedProduct) === String(f.id_item_general) && <Check size={14} />}
                </button>
              ))
            ) : loading ? (
              <div className="px-4 py-6 text-center">
                <div className="flex items-center justify-center flex-col gap-2">
                  <Loader2 className="animate-spin text-semantic-info" size={22} />
                  <span className="text-[10px] text-content-muted font-bold uppercase">Cargando productos...</span>
                </div>
              </div>
            ) : (
              <div className="px-4 py-6 text-center text-content-muted text-[10px] font-bold uppercase">
                Sin resultados
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};