import cn from '../../utils/cn';
import { SidebarFlyoutItem } from './SidebarFlyoutItem';

export const SidebarFlyoutPanel = ({ group, top, cancelClose, scheduleCloseFlyout, activeTitle, onItemClick }) => (
  <div
    onMouseEnter={cancelClose}
    onMouseLeave={scheduleCloseFlyout}
    style={{ top, left: 88 }}
    className={cn(
      'fixed z-[60] w-56 py-2',
      'bg-surface-sidebar border border-surface-sidebar-hover rounded-lg shadow-2xl',
      'animate-in fade-in slide-in-from-left-2 duration-150',
    )}
  >
    <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-content-muted/70 border-b border-surface-sidebar-hover/60 mb-1">
      {group.grupo}
    </p>
    <div className="flex flex-col px-1.5 space-y-0.5">
      {group.items.map((item) => (
        <SidebarFlyoutItem
          key={item.link}
          item={item}
          isActive={activeTitle === item.label}
          onClick={() => onItemClick(item)}
        />
      ))}
    </div>
  </div>
);

export default SidebarFlyoutPanel;
