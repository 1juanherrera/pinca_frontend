import { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import StatusBadge from '../../../shared/StatusBadge';
import { fmt } from '../../../utils/formatters';
import { TIPO_TONE, TIPO_LABEL, fmtNum } from './constants';
import DiasRestantes from './DiasRestantes';

// ── Fila expandible ───────────────────────────────────────────────────────────
const ItemRow = ({ item, index, onAjustar }) => {
  const [open, setOpen] = useState(false);
  const hasBodegas = item.stock_por_bodega.length > 0;
  const sinStock   = item.stock_total === 0;

  return (
    <>
      <tr
        onClick={() => hasBodegas && setOpen((o) => !o)}
        className={`
          border-b border-border-subtle text-sm transition-colors
          ${open ? 'bg-surface-muted' : index % 2 === 0 ? 'bg-surface-base' : 'bg-surface-subtle'}
          ${hasBodegas ? 'cursor-pointer hover:bg-surface-muted' : 'hover:bg-surface-subtle'}
        `}
      >
        {/* Expand */}
        <td className="pl-4 pr-2 py-2 w-8">
          {hasBodegas
            ? (open
                ? <ChevronDown size={14} className="text-brand-primary" />
                : <ChevronRight size={14} className="text-content-muted" />)
            : null}
        </td>

        {/* # */}
        <td className="px-2 py-2 text-xs text-content-muted tabular-nums w-10 text-center">
          {index + 1}
        </td>

        {/* Ítem */}
        <td className="px-3 py-2 min-w-[200px]">
          <p className="font-semibold text-content-primary">{item.nombre}</p>
          <p className="text-content-tertiary text-xs mt-0.5 font-mono">{item.codigo}</p>
        </td>

        {/* Tipo */}
        <td className="px-3 py-2">
          <StatusBadge
            tone={TIPO_TONE[item.tipo] ?? 'neutral'}
            label={TIPO_LABEL[item.tipo] ?? '—'}
            dot={false}
            size="sm"
            fixedWidth
          />
        </td>

        {/* Stock */}
        <td className="px-3 py-2 text-right tabular-nums">
          {sinStock ? (
            <span className="text-content-muted text-xs italic">Sin stock</span>
          ) : (
            <span>
              <span className="font-bold text-content-primary">{fmtNum(item.stock_total)}</span>
              <span className="text-content-tertiary text-xs ml-1">{item.unidad_base}</span>
            </span>
          )}
        </td>

        {/* Bodegas */}
        <td className="px-3 py-2 text-center">
          {item.bodegas_con_stock > 0 ? (
            <StatusBadge
              tone="neutral"
              label={`${item.bodegas_con_stock} ${item.bodegas_con_stock === 1 ? 'bodega' : 'bodegas'}`}
              dot={false}
              size="sm"
              fixedWidth
            />
          ) : (
            <span className="text-content-muted text-xs">—</span>
          )}
        </td>

        {/* Costo promedio */}
        <td className="px-3 py-2 text-right tabular-nums">
          {item.costo_promedio > 0 ? (
            <span>
              <span className="font-medium text-content-primary">{fmt(item.costo_promedio)}</span>
              <span className="text-content-tertiary text-xs ml-1">/{item.unidad_base}</span>
            </span>
          ) : (
            <span className="text-content-muted text-xs">—</span>
          )}
        </td>

        {/* Valor inventario */}
        <td className="px-3 py-2 text-right tabular-nums">
          {item.valor_inventario > 0 ? (
            <span className="font-bold text-content-primary">{fmt(item.valor_inventario)}</span>
          ) : (
            <span className="text-content-muted text-xs">—</span>
          )}
        </td>

        {/* Consumo 30d */}
        <td className="px-3 py-2 text-right tabular-nums text-content-secondary text-sm">
          {item.consumo_30_dias
            ? <span>{fmtNum(item.consumo_30_dias, 1)} <span className="text-content-tertiary text-xs">{item.unidad_base}</span></span>
            : <span className="text-content-muted text-xs">—</span>}
        </td>

        {/* Días restantes */}
        <td className="px-3 py-2 text-center">
          <DiasRestantes dias={item.dias_restantes} />
        </td>
      </tr>

      {/* Desglose bodegas */}
      {open && (
        <tr className="border-b border-border-subtle bg-surface-subtle border-l-4 border-l-brand-primary">
          <td colSpan={10} className="px-10 py-4">
            <p className="text-xs font-bold text-content-secondary uppercase tracking-wider mb-3">
              Stock por bodega
            </p>
            <div className="flex flex-wrap gap-2">
              {item.stock_por_bodega.map((b) => (
                <div
                  key={b.bodega_id}
                  className="group relative bg-surface-base border border-brand-primary/15 rounded-xl px-4 py-3 min-w-40 shadow-sm"
                >
                  <p className="font-semibold text-content-primary text-sm pr-7">{b.bodega}</p>
                  {b.instalacion && (
                    <p className="text-content-tertiary text-xs mt-0.5">{b.instalacion}</p>
                  )}
                  <p className="font-bold text-content-primary mt-2 text-base tabular-nums">
                    {fmtNum(b.cantidad)}{' '}
                    <span className="font-normal text-content-tertiary text-sm">{item.unidad_base}</span>
                  </p>
                  {b.cantidad > 0 && onAjustar && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onAjustar(item, b); }}
                      title="Ajuste manual (rotura, derrame, conteo)"
                      className="absolute top-2 right-2 inline-flex items-center justify-center w-6 h-6 rounded-md bg-semantic-warning-subtle border border-semantic-warning/30 text-semantic-warning-fg hover:bg-semantic-warning hover:text-white hover:border-semantic-warning transition-all"
                    >
                      <Wrench size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default ItemRow;
