import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import IconBox from './IconBox';

const HeaderSection = ({ title, subtitle, description, icon: Icon, breadcrumbs = [] }) => {
  return (
    <div className="flex items-center gap-3 min-w-0">
      {Icon && <IconBox icon={Icon} tone="dark" variant="solid" size="md" shape="rounded" />}

      <div className="min-w-0">
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-[10px] font-semibold text-content-muted uppercase tracking-wider mb-1">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-1.5">
                {crumb.path ? (
                  <Link
                    to={crumb.path}
                    className="hover:text-content-primary transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-content-tertiary">{crumb.label}</span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight size={10} className="text-content-muted shrink-0" />
                )}
              </div>
            ))}
          </nav>
        )}

        <h2 className="text-lg font-bold text-content-primary leading-tight truncate">
          {title}
        </h2>

        {(subtitle || description) && (
          <p className="text-xs text-content-tertiary mt-0.5 leading-snug truncate">
            {subtitle || description}
          </p>
        )}
      </div>
    </div>
  );
};

export default HeaderSection;
