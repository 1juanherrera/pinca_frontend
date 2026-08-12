import { NavLink } from 'react-router';
import cn from '../../utils/cn';

export const SidebarExpandedItem = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  return (
    <NavLink
      to={`/${item.link}`}
      onClick={onClick}
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

export default SidebarExpandedItem;
