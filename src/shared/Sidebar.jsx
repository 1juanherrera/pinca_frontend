import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Cog,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Store,
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import logoPinca from '../assets/pincaicono.png';
import { useBoundStore } from '../store/useBoundStore';
import { sidebarMenu } from '../config/sidebarMenu';
import cn from '../utils/cn';

const PINNED_KEY    = 'sidebar_pinned';
const COLLAPSED_KEY = 'sidebar_collapsed_groups';

// Icono representativo por grupo (cuando el sidebar está plegado).
// Se eligen iconos diferentes a los de los items individuales para evitar confusión.
const GROUP_ICONS = {
  'Inventario': Package,
  'Producción': Cog,
  'Ventas':     ShoppingCart,
  'Compras':    Store,
  'Análisis':   BarChart3,
};

const loadJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};
const saveJson = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* noop */ }
};

const Sidebar = () => {
  const [isPinned, setIsPinned]       = useState(() => loadJson(PINNED_KEY, false));
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set(loadJson(COLLAPSED_KEY, [])));

  // Flyout state
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [flyoutTop, setFlyoutTop]       = useState(0);
  const closeTimer = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const setActiveTitle = useBoundStore((s) => s.setActiveTitle);
  const logout         = useBoundStore((s) => s.logout);
  const user           = useBoundStore((s) => s.user);
  const activeTitle    = useBoundStore((s) => s.activeTitle);

  const modulos = user?.modulos ?? [];
  const esAdmin = user?.rol === 'admin';

  const menuVisible = useMemo(
    () => esAdmin
      ? sidebarMenu
      : sidebarMenu.filter((item) => modulos.includes(item.moduloKey)),
    [esAdmin, modulos],
  );

  // Agrupar conservando orden del array original
  const groups = useMemo(() => {
    const order = [];
    const map = new Map();
    for (const item of menuVisible) {
      const g = item.grupo ?? '__root__';
      if (!map.has(g)) {
        map.set(g, []);
        order.push(g);
      }
      map.get(g).push(item);
    }
    return order.map((g) => ({ grupo: g === '__root__' ? null : g, items: map.get(g) }));
  }, [menuVisible]);

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      saveJson(PINNED_KEY, next);
      return next;
    });
  };

  const toggleGroup = (g) => {
    if (!g) return;
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      saveJson(COLLAPSED_KEY, [...next]);
      return next;
    });
  };

  // Sincronizar título activo + auto-expandir grupo del item activo
  useEffect(() => {
    const currentPath = location.pathname.split('/')[1] || '';
    const currentItem = sidebarMenu.find((item) => item.link === currentPath);
    if (currentItem && activeTitle !== currentItem.label) {
      setActiveTitle(currentItem.label);
    }
    if (currentItem?.grupo && collapsedGroups.has(currentItem.grupo)) {
      setCollapsedGroups((prev) => {
        const next = new Set(prev);
        next.delete(currentItem.grupo);
        saveJson(COLLAPSED_KEY, [...next]);
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Cerrar flyout al cambiar de ruta
  useEffect(() => { setHoveredGroup(null); }, [location.pathname]);

  // Cleanup timer
  useEffect(() => () => closeTimer.current && clearTimeout(closeTimer.current), []);

  const openFlyout = (grupo, event) => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
    const rect = event.currentTarget.getBoundingClientRect();
    setFlyoutTop(rect.top);
    setHoveredGroup(grupo);
  };
  const scheduleCloseFlyout = () => {
    closeTimer.current = setTimeout(() => setHoveredGroup(null), 180);
  };
  const cancelClose = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // ─── Item individual (modo expandido) ────────────────────────────────────
  const renderExpandedItem = (item) => {
    const Icon = item.icon;
    const isActive = activeTitle === item.label;
    return (
      <NavLink
        key={item.link}
        to={`/${item.link}`}
        onClick={() => setActiveTitle(item.label)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 group relative',
          isActive
            ? 'bg-brand-subtle text-white'
            : 'text-content-muted hover:bg-surface-sidebar-hover hover:text-white',
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-primary rounded-r" />
        )}
        <Icon
          size={18}
          className={cn(
            'shrink-0 transition-colors duration-200',
            isActive ? 'text-brand-primary' : 'text-content-muted group-hover:text-white',
          )}
        />
        <span className="whitespace-nowrap">{item.label}</span>
      </NavLink>
    );
  };

  // ─── Item del flyout (cuando plegado) ────────────────────────────────────
  const renderFlyoutItem = (item) => {
    const Icon = item.icon;
    const isActive = activeTitle === item.label;
    return (
      <NavLink
        key={item.link}
        to={`/${item.link}`}
        onClick={() => { setActiveTitle(item.label); setHoveredGroup(null); }}
        className={cn(
          'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors group',
          isActive
            ? 'bg-brand-subtle text-white'
            : 'text-content-muted hover:bg-surface-sidebar-hover hover:text-white',
        )}
      >
        <Icon size={16} className={cn('shrink-0', isActive ? 'text-brand-primary' : 'text-content-muted group-hover:text-white')} />
        <span className="whitespace-nowrap text-xs font-medium">{item.label}</span>
      </NavLink>
    );
  };

  // ─── Icono individual cuando plegado (Panel Principal y demás sin grupo) ─
  const renderCollapsedSingle = (item) => {
    const Icon = item.icon;
    const isActive = activeTitle === item.label;
    return (
      <NavLink
        key={item.link}
        to={`/${item.link}`}
        onClick={() => setActiveTitle(item.label)}
        title={item.label}
        onMouseEnter={() => { cancelClose(); setHoveredGroup(null); }}
        className={cn(
          'flex items-center justify-center p-2 rounded-md transition-colors duration-200 group',
          isActive
            ? 'bg-brand-subtle text-white'
            : 'text-content-muted hover:bg-surface-sidebar-hover hover:text-white',
        )}
      >
        <Icon
          size={18}
          className={cn(
            'shrink-0 transition-colors duration-200',
            isActive ? 'text-brand-primary' : 'text-content-muted group-hover:text-white',
          )}
        />
      </NavLink>
    );
  };

  // ─── Icono de grupo cuando plegado (con flyout al hover) ─────────────────
  const renderCollapsedGroup = (group) => {
    const Icon = GROUP_ICONS[group.grupo] ?? Package;
    const hasActiveChild = group.items.some((it) => activeTitle === it.label);
    const isOpen = hoveredGroup === group.grupo;

    return (
      <button
        key={group.grupo}
        type="button"
        onMouseEnter={(e) => openFlyout(group.grupo, e)}
        onMouseLeave={scheduleCloseFlyout}
        title={group.grupo}
        className={cn(
          'flex items-center justify-center p-2 rounded-md transition-colors duration-200 group relative',
          (hasActiveChild || isOpen)
            ? 'bg-surface-sidebar-hover text-white'
            : 'text-content-muted hover:bg-surface-sidebar-hover hover:text-white',
        )}
      >
        {hasActiveChild && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-primary rounded-r" />
        )}
        <Icon
          size={18}
          className={cn(
            'shrink-0 transition-colors',
            hasActiveChild ? 'text-brand-primary' : '',
          )}
        />
      </button>
    );
  };

  // ─── Layout principal ────────────────────────────────────────────────────
  const isExpanded = isPinned;

  return (
    <div className={cn('relative shrink-0 h-screen z-50', isExpanded ? 'w-64' : 'w-20')}>
      <aside
        className={cn(
          'absolute top-0 z-50 left-0 flex flex-col h-screen py-4 bg-surface-sidebar border-r border-surface-sidebar-hover font-sans transition-all duration-300 ease-in-out',
          isExpanded ? 'w-64 px-3' : 'w-20 px-3',
        )}
      >
        {/* Logo + Pin toggle */}
        <div className={cn('flex items-center mb-5 overflow-hidden', isExpanded ? 'justify-between gap-2 px-1' : 'justify-center')}>
          <div className={cn('flex items-center min-w-0', isExpanded && 'gap-2.5')}>
            <div className="flex items-center justify-center w-9 h-9 rounded-lg overflow-hidden shrink-0">
              <img src={logoPinca} alt="Logo Pinca" className="w-full h-full object-contain" />
            </div>
            {isExpanded && (
              <span className="text-white font-semibold text-sm tracking-wide whitespace-nowrap truncate">
                Gestor Pinca
              </span>
            )}
          </div>

          {isExpanded && (
            <button
              type="button"
              onClick={togglePin}
              title="Plegar sidebar"
              className="shrink-0 p-1.5 rounded-md text-content-muted hover:text-white hover:bg-surface-sidebar-hover transition-colors"
            >
              <ChevronsLeft size={14} />
            </button>
          )}
        </div>

        {/* Botón pin cuando plegado (debajo del logo) */}
        {!isExpanded && (
          <button
            type="button"
            onClick={togglePin}
            title="Fijar sidebar abierto"
            className="mx-auto mb-3 p-1.5 rounded-md text-content-muted/60 hover:text-white hover:bg-surface-sidebar-hover transition-colors"
          >
            <ChevronsRight size={14} />
          </button>
        )}

        {/* Navegación */}
        <nav className="flex-1 p-1 overflow-x-hidden no-scrollbar overflow-y-auto">
          {isExpanded ? (
            // ── Modo expandido: items con headers de sección colapsables ──
            groups.map((group, idx) => {
              const isCollapsed = group.grupo ? collapsedGroups.has(group.grupo) : false;
              const showHeader  = !!group.grupo;

              return (
                <div key={group.grupo ?? '__root__'} className={cn('flex flex-col', idx > 0 && 'mt-3')}>
                  {showHeader && (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.grupo)}
                      className={cn(
                        'group/header flex items-center justify-between w-full px-3 py-1.5 rounded-md',
                        'text-[10px] font-semibold uppercase tracking-wider',
                        'text-content-muted/70 hover:text-content-muted transition-colors',
                      )}
                    >
                      <span>{group.grupo}</span>
                      <ChevronRight
                        size={11}
                        className={cn(
                          'transition-transform duration-200 opacity-60 group-hover/header:opacity-100',
                          !isCollapsed && 'rotate-90',
                        )}
                      />
                    </button>
                  )}
                  <div
                    className={cn(
                      'flex flex-col space-y-1 overflow-hidden transition-all duration-300 ease-in-out',
                      showHeader && (isCollapsed
                        ? 'max-h-0 opacity-0 mt-0'
                        : 'max-h-[600px] opacity-100 mt-1'),
                    )}
                  >
                    {group.items.map(renderExpandedItem)}
                  </div>
                </div>
              );
            })
          ) : (
            // ── Modo plegado: 1 icono por grupo + items sin grupo ──
            <div className="flex flex-col items-center gap-1">
              {groups.map((group, idx) => (
                <div key={group.grupo ?? '__root__'} className="contents">
                  {idx > 0 && (
                    <div className="my-1 w-8 border-t border-surface-sidebar-hover/60" aria-hidden />
                  )}
                  {group.grupo
                    ? renderCollapsedGroup(group)
                    : group.items.map(renderCollapsedSingle)}
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* Acciones inferiores */}
        <div className="pt-3 px-1 mt-auto border-t border-surface-sidebar-hover space-y-1 overflow-hidden">
          <NavLink
            to="/configuracion"
            title={!isExpanded ? 'Configuración' : ''}
            className={cn(
              'w-full flex items-center rounded-md text-content-muted hover:bg-surface-sidebar-hover hover:text-white transition-colors group',
              isExpanded ? 'gap-3 px-3 py-2 text-sm font-medium' : 'justify-center p-2',
            )}
          >
            <Settings size={18} className="shrink-0 text-content-muted group-hover:text-white" />
            {isExpanded && <span className="whitespace-nowrap">Configuración</span>}
          </NavLink>

          <button
            type="button"
            title={!isExpanded ? 'Cerrar Sesión' : ''}
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center rounded-md text-content-muted hover:bg-semantic-danger/10 hover:text-semantic-danger transition-colors group cursor-pointer',
              isExpanded ? 'gap-3 px-3 py-2 text-sm font-medium' : 'justify-center p-2',
            )}
          >
            <LogOut size={18} className="shrink-0 text-content-muted group-hover:text-semantic-danger" />
            {isExpanded && <span className="whitespace-nowrap">Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* ─── FLYOUT (solo cuando plegado) ─── */}
      {!isExpanded && hoveredGroup && (() => {
        const group = groups.find((g) => g.grupo === hoveredGroup);
        if (!group) return null;
        return (
          <div
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleCloseFlyout}
            style={{ top: flyoutTop, left: 88 }}
            className={cn(
              'fixed z-[60] w-56 py-2',
              'bg-surface-sidebar border border-surface-sidebar-hover rounded-lg shadow-2xl',
              'animate-in fade-in slide-in-from-left-2 duration-150',
            )}
          >
            <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-content-muted/70 border-b border-surface-sidebar-hover/60 mb-1">
              {hoveredGroup}
            </p>
            <div className="flex flex-col px-1.5 space-y-0.5">
              {group.items.map(renderFlyoutItem)}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Sidebar;
