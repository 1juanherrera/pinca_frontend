import { NavLink } from 'react-router';
import cn from '../../utils/cn';

export const SidebarCollapsedSingleItem = ({ item, isActive, onClick, onMouseEnter }) => {
  const Icon = item.icon;
  return (
    <NavLink
      to={`/${item.link}`}
      onClick={onClick}
      title={item.label}
      onMouseEnter={onMouseEnter}
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

export default SidebarCollapsedSingleItem;
