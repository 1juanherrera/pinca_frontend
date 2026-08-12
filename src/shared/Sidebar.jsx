import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { useBoundStore } from '../store/useBoundStore';
import { sidebarMenu } from '../config/sidebarMenu';
import cn from '../utils/cn';
import { COLLAPSED_KEY, PINNED_KEY, loadJson, saveJson } from './Sidebar/helpers';
import SidebarHeader from './Sidebar/SidebarHeader';
import SidebarFooterActions from './Sidebar/SidebarFooterActions';
import SidebarExpandedItem from './Sidebar/SidebarExpandedItem';
import SidebarCollapsedSingleItem from './Sidebar/SidebarCollapsedSingleItem';
import SidebarCollapsedGroupIcon from './Sidebar/SidebarCollapsedGroupIcon';
import SidebarFlyoutPanel from './Sidebar/SidebarFlyoutPanel';

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

  const esAdmin = user?.rol === 'admin';

  const menuVisible = useMemo(
    () => esAdmin
      ? sidebarMenu
      : sidebarMenu.filter((item) => (user?.modulos ?? []).includes(item.moduloKey)),
    [esAdmin, user?.modulos],
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
        <SidebarHeader isExpanded={isExpanded} togglePin={togglePin} />

        {/* Navegación */}
        <nav className="flex-1 p-1 overflow-x-hidden no-scrollbar overflow-y-auto">
          {isExpanded ? (
            // ── Modo expandido: items con headers de sección colapsables ──
            // Si un grupo tiene un solo item, ocultamos el header — el header
            // colapsable no aporta cuando solo hay un destino debajo.
            groups.map((group, idx) => {
              const isCollapsed = group.grupo ? collapsedGroups.has(group.grupo) : false;
              const showHeader  = !!group.grupo && group.items.length > 1;

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
                    {group.items.map((item) => (
                      <SidebarExpandedItem
                        key={item.link}
                        item={item}
                        isActive={activeTitle === item.label}
                        onClick={() => setActiveTitle(item.label)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            // ── Modo plegado: 1 icono por grupo + items sin grupo ──
            // Grupos con un solo item se renderizan como item directo
            // (sin flyout): el hover no aporta valor cuando hay un solo destino.
            <div className="flex flex-col items-center gap-1">
              {groups.map((group, idx) => (
                <div key={group.grupo ?? '__root__'} className="contents">
                  {idx > 0 && (
                    <div className="my-1 w-8 border-t border-surface-sidebar-hover/60" aria-hidden />
                  )}
                  {!group.grupo || group.items.length === 1
                    ? group.items.map((item) => (
                        <SidebarCollapsedSingleItem
                          key={item.link}
                          item={item}
                          isActive={activeTitle === item.label}
                          onClick={() => setActiveTitle(item.label)}
                          onMouseEnter={() => { cancelClose(); setHoveredGroup(null); }}
                        />
                      ))
                    : (
                        <SidebarCollapsedGroupIcon
                          group={group}
                          hasActiveChild={group.items.some((it) => activeTitle === it.label)}
                          isOpen={hoveredGroup === group.grupo}
                          onMouseEnter={(e) => openFlyout(group.grupo, e)}
                          onMouseLeave={scheduleCloseFlyout}
                        />
                      )}
                </div>
              ))}
            </div>
          )}
        </nav>

        <SidebarFooterActions isExpanded={isExpanded} handleLogout={handleLogout} />
      </aside>

      {/* ─── FLYOUT (solo cuando plegado) ─── */}
      {!isExpanded && hoveredGroup && (() => {
        const group = groups.find((g) => g.grupo === hoveredGroup);
        if (!group) return null;
        return (
          <SidebarFlyoutPanel
            group={group}
            top={flyoutTop}
            cancelClose={cancelClose}
            scheduleCloseFlyout={scheduleCloseFlyout}
            activeTitle={activeTitle}
            onItemClick={(item) => { setActiveTitle(item.label); setHoveredGroup(null); }}
          />
        );
      })()}
    </div>
  );
};

export default Sidebar;
