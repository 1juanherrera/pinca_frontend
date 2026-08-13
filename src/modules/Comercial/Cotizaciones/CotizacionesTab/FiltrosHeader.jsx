import { FileSpreadsheet } from 'lucide-react';
import { Button } from '../../../../shared/Button';
import SearchFilterBar from '../../../../shared/SearchFilterBar';
import { STATUS_OPTIONS } from './constants';

export const FiltrosHeader = ({ search, setSearch, filters, onFilterChange, onExportExcel, exportDisabled }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 min-w-0">
      <SearchFilterBar
        search={search}
        onSearch={setSearch}
        placeholder="Buscar por número, empresa o encargado..."
        values={filters}
        onChange={onFilterChange}
        statusOptions={STATUS_OPTIONS}
      />
    </div>
    <Button
      variant="secondary"
      size="sm"
      icon={FileSpreadsheet}
      onClick={onExportExcel}
      disabled={exportDisabled}
    >
      Excel
    </Button>
  </div>
);

export default FiltrosHeader;
