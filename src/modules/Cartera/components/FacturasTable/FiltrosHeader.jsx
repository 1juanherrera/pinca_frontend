import SearchFilterBar from '../../../../shared/SearchFilterBar';
import { STATUS_OPTIONS, SECTOR_OPTIONS } from './constants';

export const FiltrosHeader = ({ search, setSearch, filters, onFilterChange, onSectorChange }) => (
  <div className="flex flex-wrap items-end gap-3">
    <div className="flex-1 min-w-48">
      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por número, cliente o ciudad..."
        values={filters}
        onChange={onFilterChange}
        statusOptions={STATUS_OPTIONS}
      />
    </div>
    {/* Filtro de sector */}
    <div className="flex items-center gap-2 shrink-0">
      {SECTOR_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onSectorChange(value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            filters.sector === value
              ? 'bg-content-primary text-content-inverse border-content-primary'
              : 'bg-surface-base text-content-tertiary border-border-base hover:border-border-strong'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  </div>
);

export default FiltrosHeader;
