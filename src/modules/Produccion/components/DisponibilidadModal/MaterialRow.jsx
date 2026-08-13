import EstadoChip from './EstadoChip';
import ProveedorSelector from './ProveedorSelector';
import { fmtNum } from './helpers';

// ── Fila de material ──────────────────────────────────────────────────────────
export const MaterialRow = ({ material, seleccion, onSelect }) => (
  <div
    className={`rounded-xl border px-4 py-3 ${
      material.tiene_deficit
        ? 'border-semantic-danger/20 bg-semantic-danger-subtle/40'
        : 'border-border-subtle bg-surface-base'
    }`}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="font-semibold text-sm text-content-primary truncate">{material.nombre}</p>
        <p className="text-[10px] text-content-muted font-mono">{material.codigo}</p>
      </div>
      <EstadoChip tieneDeficit={material.tiene_deficit} deficit={material.deficit} />
    </div>

    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
      <div>
        <span className="text-content-muted">Necesario</span>
        <p className="font-semibold text-content-secondary">{fmtNum(material.cantidad_necesaria)}</p>
      </div>
      <div>
        <span className="text-content-muted">En stock</span>
        <p className={`font-semibold ${material.tiene_deficit ? 'text-semantic-danger-fg' : 'text-semantic-success-fg'}`}>
          {fmtNum(material.cantidad_disponible)}
        </p>
      </div>
      {material.tiene_deficit && (
        <div>
          <span className="text-content-muted">A comprar</span>
          <p className="font-semibold text-semantic-danger-fg">{fmtNum(material.deficit)}</p>
        </div>
      )}
    </div>

    {material.tiene_deficit && (
      <ProveedorSelector
        material={material}
        seleccion={seleccion}
        onSelect={onSelect}
      />
    )}
  </div>
);

export default MaterialRow;
