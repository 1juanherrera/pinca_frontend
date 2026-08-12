import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import logoPinca from '../../assets/pincaicono.png';
import cn from '../../utils/cn';

export const SidebarHeader = ({ isExpanded, togglePin }) => (
  <>
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
  </>
);

export default SidebarHeader;
