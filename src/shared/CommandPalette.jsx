/**
 * CommandPalette — Búsqueda global Cmd+K (estilo Linear/Raycast).
 *
 * Se monta una vez en Layout. Captura globalmente Cmd+K / Ctrl+K.
 * Resuelve dos casos:
 *   1) Saltar a una entidad (factura, cliente, item, OC, etc.) vía /api/search.
 *   2) Saltar a una página del sistema (atajos rápidos).
 *
 * Navegación con teclado: ↑↓ mueve, Enter selecciona, Esc cierra.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Search, X, Package, Users, Truck, FileText, FileMinus, FileSignature,
  ShoppingBag, Receipt, ArrowRight, Command,
  LayoutDashboard, FlaskConical, Factory, Wallet, Handbag, ArrowDownUp,
  TrendingUp, BookOpen, Boxes, Building2, GitBranch, GitMerge, Settings,
} from 'lucide-react';
import apiClient from '../api/apiClient';
import { API_ROUTES } from '../api/apiRoutes';

const TIPOS = {
  item:         { label: 'Items',       icon: Package,        tone: 'text-semantic-info-fg     bg-semantic-info-subtle' },
  cliente:      { label: 'Clientes',    icon: Users,          tone: 'text-brand-primary-active bg-brand-subtle' },
  proveedor:    { label: 'Proveedores', icon: Truck,          tone: 'text-semantic-warning-fg  bg-semantic-warning-subtle' },
  factura:      { label: 'Facturas',    icon: Receipt,        tone: 'text-semantic-success-fg  bg-semantic-success-subtle' },
  cotizacion:   { label: 'Cotizaciones', icon: FileText,      tone: 'text-semantic-info-fg     bg-semantic-info-subtle' },
  remision:     { label: 'Remisiones',  icon: FileSignature,  tone: 'text-content-secondary    bg-surface-strong' },
  orden_compra: { label: 'Órdenes de compra', icon: ShoppingBag, tone: 'text-semantic-warning-fg bg-semantic-warning-subtle' },
  nota_credito: { label: 'Notas crédito', icon: FileMinus,    tone: 'text-semantic-danger-fg   bg-semantic-danger-subtle' },
  pagina:       { label: 'Ir a',         icon: ArrowRight,    tone: 'text-content-secondary    bg-surface-muted' },
};

const PAGINAS = [
  { tipo: 'pagina', id: 'p-panel',     label: 'Panel principal',    sublabel: 'Dashboard',           path: '/',                  icon: LayoutDashboard },
  { tipo: 'pagina', id: 'p-sedes',     label: 'Sedes y bodegas',    sublabel: 'Inventario',          path: '/sedes',             icon: Building2 },
  { tipo: 'pagina', id: 'p-catalogo',  label: 'Catálogo',           sublabel: 'Inventario',          path: '/catalogo',          icon: BookOpen },
  { tipo: 'pagina', id: 'p-inv',       label: 'Stock',              sublabel: 'Catálogo → Stock',    path: '/catalogo?tab=stock', icon: Boxes },
  { tipo: 'pagina', id: 'p-mov',       label: 'Movimientos',        sublabel: 'Inventario',          path: '/movimientos',       icon: ArrowDownUp },
  { tipo: 'pagina', id: 'p-traz',      label: 'Trazabilidad',       sublabel: 'Inventario',          path: '/trazabilidad',      icon: GitBranch },
  { tipo: 'pagina', id: 'p-form',      label: 'Formulaciones',      sublabel: 'Producción',          path: '/formulaciones',     icon: FlaskConical },
  { tipo: 'pagina', id: 'p-prod',      label: 'Producción',         sublabel: 'Producción',          path: '/produccion',        icon: Factory },
  { tipo: 'pagina', id: 'p-com',       label: 'Comercial',          sublabel: 'Ventas',              path: '/comercial',         icon: Handbag },
  { tipo: 'pagina', id: 'p-cart',      label: 'Cartera',            sublabel: 'Ventas',              path: '/cartera',           icon: Wallet },
  { tipo: 'pagina', id: 'p-cli',       label: 'Clientes',           sublabel: 'Ventas',              path: '/clientes',          icon: Users },
  { tipo: 'pagina', id: 'p-comp',      label: 'Compras',            sublabel: 'Compras',             path: '/compras',           icon: ShoppingBag },
  { tipo: 'pagina', id: 'p-prov',      label: 'Proveedores',        sublabel: 'Compras',             path: '/proveedores',       icon: Truck },
  { tipo: 'pagina', id: 'p-rent',      label: 'Rentabilidad',       sublabel: 'Análisis',            path: '/rentabilidad',      icon: TrendingUp },
  { tipo: 'pagina', id: 'p-sinc',      label: 'Sincronización',     sublabel: 'Sistema',             path: '/sincronizacion',    icon: GitMerge },
  { tipo: 'pagina', id: 'p-cfg',       label: 'Configuración',      sublabel: 'Sistema',             path: '/configuracion',     icon: Settings },
];

const filterPaginas = (q) => {
  if (!q) return PAGINAS.slice(0, 6);
  const lower = q.toLowerCase();
  return PAGINAS.filter((p) =>
    p.label.toLowerCase().includes(lower) || p.sublabel.toLowerCase().includes(lower)
  ).slice(0, 8);
};

const useGlobalSearch = (q) =>
  useQuery({
    queryKey: ['global-search', q],
    queryFn:  () => apiClient.get(API_ROUTES.SEARCH(q, 5)),
    enabled:  !!q && q.length >= 2,
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });

// Wrapper que monta el body sólo cuando isOpen — así el state interno se resetea
// gratis al cerrar sin necesidad de setState en effect.
const CommandPalette = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return <CommandPaletteBody onClose={onClose} />;
};

const CommandPaletteBody = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef(null);
  const listRef  = useRef(null);
  const navigate = useNavigate();

  // Focus al montar (sólo ocurre cuando se abre, ya que el wrapper desmonta al cerrar)
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  const { data: remoto = [], isFetching } = useGlobalSearch(debounced);

  // Combina resultados remotos + páginas filtradas
  const flat = useMemo(() => {
    const paginas = filterPaginas(debounced).map((p) => ({ ...p, _grupoOrden: 99 }));
    const ordenTipos = ['item', 'cliente', 'proveedor', 'factura', 'cotizacion', 'remision', 'orden_compra', 'nota_credito'];
    const remotos = (remoto ?? []).map((r) => ({
      ...r,
      _grupoOrden: ordenTipos.indexOf(r.tipo),
      _key: `${r.tipo}-${r.id}`,
    }));
    return [...remotos, ...paginas].map((r, i) => ({ ...r, _key: r._key ?? r.id ?? `row-${i}`, _idx: i }));
  }, [remoto, debounced]);

  // Clamp highlight dentro del rango de resultados (cuando la lista achica)
  const safeHighlighted = Math.min(highlighted, Math.max(0, flat.length - 1));

  // Scroll item resaltado a la vista
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${safeHighlighted}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [safeHighlighted]);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, Math.max(0, flat.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlighted((h) => Math.max(0, h - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = flat[safeHighlighted];
        if (item?.path) { navigate(item.path); onClose(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flat, safeHighlighted, navigate, onClose]);

  // Agrupar para render con headers
  const grupos = [];
  let lastTipo = null;
  flat.forEach((r) => {
    if (r.tipo !== lastTipo) {
      grupos.push({ tipo: r.tipo, items: [] });
      lastTipo = r.tipo;
    }
    grupos[grupos.length - 1].items.push(r);
  });

  return createPortal(
    <div
      className="fixed inset-0 z-140 flex items-start justify-center pt-[12vh] px-4 animate-in fade-in"
      style={{ background: 'var(--surface-overlay)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-surface-base rounded-2xl shadow-2xl border border-border-base overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[70vh]"
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle transition-shadow focus-within:shadow-[inset_0_-2px_0_0_var(--brand-primary)]">
          <Search size={16} className="text-content-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar facturas, clientes, items, OCs… o saltar a una página"
            className="flex-1 bg-transparent text-sm text-content-primary placeholder:text-content-muted focus:outline-none focus-visible:outline-none"
            style={{ outline: 'none' }}
          />
          {isFetching && (
            <span className="w-3.5 h-3.5 border-2 border-content-muted border-t-transparent rounded-full animate-spin" />
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold text-content-muted bg-surface-muted border border-border-base rounded">
            ESC
          </kbd>
          <button onClick={onClose} aria-label="Cerrar" className="text-content-muted hover:text-content-primary transition sm:hidden">
            <X size={16} />
          </button>
        </div>

        {/* Lista */}
        <div ref={listRef} className="flex-1 overflow-y-auto">
          {flat.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 px-5 text-content-muted">
              <Search size={22} className="opacity-40" />
              <p className="text-xs font-medium">
                {debounced ? `Sin resultados para "${debounced}"` : 'Empezá a escribir para buscar'}
              </p>
              <p className="text-[10px] text-content-tertiary">
                Tip: probá con el número exacto (FAC-2026-0001) o parte del nombre
              </p>
            </div>
          ) : (
            grupos.map((g, gi) => {
              const cfg = TIPOS[g.tipo] ?? TIPOS.pagina;
              return (
                <div key={`${g.tipo}-${gi}`} className="py-1">
                  <div className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-content-tertiary">
                    {cfg.label}
                  </div>
                  {g.items.map((item) => {
                    const Icon = item.icon ?? cfg.icon;
                    const active = item._idx === safeHighlighted;
                    return (
                      <button
                        key={item._key}
                        type="button"
                        data-idx={item._idx}
                        onMouseEnter={() => setHighlighted(item._idx)}
                        onClick={() => { navigate(item.path); onClose(); }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                          active ? 'bg-surface-muted' : 'hover:bg-surface-subtle'
                        }`}
                      >
                        <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${cfg.tone}`}>
                          <Icon size={14} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-content-primary truncate">{item.label}</p>
                          {item.sublabel && (
                            <p className="text-[11px] text-content-tertiary truncate">{item.sublabel}</p>
                          )}
                        </div>
                        {active && (
                          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold text-content-tertiary bg-surface-base border border-border-base rounded shrink-0">
                            ↵
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border-subtle bg-surface-subtle text-[10px] text-content-tertiary">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 py-px font-bold bg-surface-base border border-border-base rounded">↑↓</kbd> navegar
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 py-px font-bold bg-surface-base border border-border-base rounded">↵</kbd> abrir
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1 py-px font-bold bg-surface-base border border-border-base rounded">esc</kbd> cerrar
            </span>
          </div>
          <span className="inline-flex items-center gap-1">
            <kbd className="px-1 py-px font-bold bg-surface-base border border-border-base rounded">ctrl</kbd> + <kbd className="px-1 py-px font-bold bg-surface-base border border-border-base rounded">K</kbd> para reabrir
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default CommandPalette;
