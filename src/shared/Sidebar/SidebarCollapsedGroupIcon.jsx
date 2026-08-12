import { Package } from 'lucide-react';
import cn from '../../utils/cn';
import { GROUP_ICONS } from './helpers';

export const SidebarCollapsedGroupIcon = ({ group, hasActiveChild, isOpen, onMouseEnter, onMouseLeave }) => {
  const Icon = GROUP_ICONS[group.grupo] ?? Package;
  return (
    <button
      type="button"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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

export default SidebarCollapsedGroupIcon;
