import { NavLink } from 'react-router';
import cn from '../../utils/cn';

export const SidebarFlyoutItem = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  return (
    <NavLink
      to={`/${item.link}`}
      onClick={onClick}
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

export default SidebarFlyoutItem;
