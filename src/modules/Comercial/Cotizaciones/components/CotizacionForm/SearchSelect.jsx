import { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, Loader2 } from 'lucide-react';

// ─── Select con búsqueda ──────────────────────────────────────────────────────
const SearchSelect = ({ placeholder, value, onChange, options = [], loading = false, renderOption, renderValue }) => {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  // Debounce del término: el input se mantiene instantáneo, pero el filtro
  // (que recorre Object.values de 100+ opciones) corre ~200ms tras teclear.
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 200);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() => {
    if (!debounced) return options;
    const q = debounced.toLowerCase();
    return options.filter((o) =>
      Object.values(o).some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [options, debounced]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setOpen((p) => !p); setSearch(''); }}
        disabled={loading && !value}
        className="w-full flex items-center justify-between text-sm border border-border-base rounded-lg px-3 py-2 bg-surface-base focus:outline-none focus:ring-2 focus:ring-brand-primary/30 text-left disabled:opacity-60 disabled:cursor-wait"
      >
        <span className={value ? 'text-content-primary' : 'text-content-muted'}>
          {value
            ? renderValue(value)
            : loading
              ? 'Cargando opciones…'
              : placeholder}
        </span>
        {loading && !value
          ? <Loader2 size={14} className="text-content-muted animate-spin" />
          : <ChevronDown size={14} className={`text-content-muted transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-surface-base border border-border-base rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border-subtle">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-muted" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-border-base rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-primary/30"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 text-center text-xs text-content-muted">Cargando...</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-content-muted">Sin resultados</div>
            ) : filtered.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-surface-subtle transition-colors border-b border-surface-subtle last:border-0"
              >
                {renderOption(opt)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSelect;
