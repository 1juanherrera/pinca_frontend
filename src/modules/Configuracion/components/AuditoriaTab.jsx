import { useState } from 'react';
import {
  ShieldCheck, ShieldAlert, ArrowDownUp, Search, ChevronLeft, ChevronRight, X,
  Calendar, User, Wifi, AlertCircle,
} from 'lucide-react';
import StatusBadge from '../../../shared/StatusBadge';
import IconBox from '../../../shared/IconBox';
import EmptyState from '../../../shared/EmptyState';
import PageTabs from '../../../shared/PageTabs';
import { Button } from '../../../shared/Button';
import { useBoundStore } from '../../../store/useBoundStore';
import { useLoginAttempts, useMovimientosAudit } from '../api/useAuditoria';

const fmtDate = (d) => {
  if (!d) return '—';
  try {
    const x = new Date(d);
    return `${x.toLocaleDateString('es-CO')} ${x.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
  } catch { return d; }
};

// ── Filtros compartidos ──────────────────────────────────────────────────────
const FilterBar = ({ filters, onChange, onClear, fields }) => (
  <div className="flex flex-wrap items-end gap-2 px-4 py-3 bg-surface-subtle border-b border-border-subtle">
    {fields.map((f) => (
      <div key={f.key} className="flex-1 min-w-[140px]">
        <label className="block text-[10px] font-semibold text-content-tertiary uppercase tracking-wider mb-1">{f.label}</label>
        {f.type === 'select' ? (
          <select
            value={filters[f.key] ?? ''}
            onChange={(e) => onChange(f.key, e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-border-base rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary/30 bg-white"
          >
            <option value="">Todos</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <input
            type={f.type ?? 'text'}
            value={filters[f.key] ?? ''}
            onChange={(e) => onChange(f.key, e.target.value)}
            placeholder={f.placeholder}
            className="w-full px-2.5 py-1.5 text-xs border border-border-base rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          />
        )}
      </div>
    ))}
    <Button size="sm" variant="ghost" icon={X} onClick={onClear}>Limpiar</Button>
  </div>
);

// ── Paginador compacto ───────────────────────────────────────────────────────
const Pager = ({ meta, onPage }) => {
  if (!meta || meta.pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-border-base bg-surface-subtle">
      <p className="text-[11px] text-content-tertiary">
        Página <span className="font-semibold text-content-primary tabular-nums">{meta.page}</span>{' '}
        de <span className="font-semibold text-content-primary tabular-nums">{meta.pages}</span>{' '}
        <span className="text-content-muted">({meta.total.toLocaleString('es-CO')} total)</span>
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(meta.page - 1)} disabled={meta.page <= 1}
          className="p-1.5 border border-border-base rounded-md bg-white hover:bg-surface-muted disabled:opacity-40 transition">
          <ChevronLeft size={13} />
        </button>
        <button onClick={() => onPage(meta.page + 1)} disabled={meta.page >= meta.pages}
          className="p-1.5 border border-border-base rounded-md bg-white hover:bg-surface-muted disabled:opacity-40 transition">
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

// ── Sub-tab: Login attempts ──────────────────────────────────────────────────
const LoginAttemptsSubtab = () => {
  const [filters, setFilters] = useState({ ip: '', usuario: '', desde: '', hasta: '', page: 1, per_page: 50 });
  const { data, isFetching } = useLoginAttempts(filters);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const setF = (k, v) => setFilters((p) => ({ ...p, [k]: v, page: 1 }));
  const clear = () => setFilters({ ip: '', usuario: '', desde: '', hasta: '', page: 1, per_page: 50 });

  return (
    <div>
      <FilterBar
        filters={filters}
        onChange={setF}
        onClear={clear}
        fields={[
          { key: 'ip',      label: 'IP',      placeholder: '172.18.0.1' },
          { key: 'usuario', label: 'Usuario', placeholder: 'jperez' },
          { key: 'desde',   label: 'Desde',   type: 'date' },
          { key: 'hasta',   label: 'Hasta',   type: 'date' },
        ]}
      />

      {rows.length === 0 ? (
        <div className="p-8">
          <EmptyState icon={ShieldCheck} title={isFetching ? 'Cargando…' : 'Sin intentos registrados'} description="Cuando alguien intente loguearse aparecerá acá." size="sm" />
        </div>
      ) : (
        <table className="w-full">
          <thead className="bg-surface-muted border-b border-border-base">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] font-semibold text-content-tertiary uppercase tracking-wider w-44">Fecha</th>
              <th className="px-4 py-2 text-left text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Usuario</th>
              <th className="px-4 py-2 text-left text-[10px] font-semibold text-content-tertiary uppercase tracking-wider w-40">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-surface-subtle">
                <td className="px-4 py-2 text-xs text-content-secondary tabular-nums inline-flex items-center gap-1.5"><Calendar size={11} className="text-content-muted" />{fmtDate(r.created_at)}</td>
                <td className="px-4 py-2 text-xs"><span className="inline-flex items-center gap-1.5 font-mono"><User size={11} className="text-content-muted" />{r.username_attempt ?? '—'}</span></td>
                <td className="px-4 py-2 text-xs font-mono text-content-tertiary inline-flex items-center gap-1.5"><Wifi size={11} className="text-content-muted" />{r.ip_address}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Pager meta={meta} onPage={(p) => setFilters((prev) => ({ ...prev, page: p }))} />
    </div>
  );
};

// ── Sub-tab: Movimientos audit ───────────────────────────────────────────────
const TIPO_TONE = { ENTRADA: 'success', SALIDA: 'danger', TRASPASO: 'info', AJUSTE: 'warning' };

const MovimientosSubtab = () => {
  const [filters, setFilters] = useState({
    tipo: '', referencia_tipo: '', item: '', responsable: '', desde: '', hasta: '',
    page: 1, per_page: 50,
  });
  const { data, isFetching } = useMovimientosAudit(filters);
  const rows = data?.data ?? [];
  const meta = data?.meta;

  const setF   = (k, v) => setFilters((p) => ({ ...p, [k]: v, page: 1 }));
  const clear  = () => setFilters({ tipo: '', referencia_tipo: '', item: '', responsable: '', desde: '', hasta: '', page: 1, per_page: 50 });

  return (
    <div>
      <FilterBar
        filters={filters}
        onChange={setF}
        onClear={clear}
        fields={[
          { key: 'tipo',  label: 'Tipo', type: 'select',
            options: [
              { value: 'ENTRADA',  label: 'Entrada' },
              { value: 'SALIDA',   label: 'Salida' },
              { value: 'TRASPASO', label: 'Traspaso' },
              { value: 'AJUSTE',   label: 'Ajuste' },
            ],
          },
          { key: 'item',         label: 'Item',         placeholder: 'nombre o código' },
          { key: 'responsable',  label: 'Responsable',  placeholder: 'usuario' },
          { key: 'desde',        label: 'Desde',        type: 'date' },
          { key: 'hasta',        label: 'Hasta',        type: 'date' },
        ]}
      />

      {rows.length === 0 ? (
        <div className="p-8">
          <EmptyState icon={ArrowDownUp} title={isFetching ? 'Cargando…' : 'Sin movimientos'} description="Ajustá los filtros o esperá a que ocurran movimientos." size="sm" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-muted border-b border-border-base">
              <tr>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-content-tertiary uppercase tracking-wider w-36">Fecha</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-content-tertiary uppercase tracking-wider w-28">Tipo</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Item</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Bodega</th>
                <th className="px-3 py-2 text-right text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Cantidad</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Referencia</th>
                <th className="px-3 py-2 text-left text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {rows.map((r) => (
                <tr key={r.id_movimiento_inventario} className="hover:bg-surface-subtle align-top">
                  <td className="px-3 py-2 text-[11px] text-content-secondary tabular-nums">{fmtDate(r.fecha_movimiento)}</td>
                  <td className="px-3 py-2">
                    <StatusBadge tone={TIPO_TONE[r.tipo_movimiento] ?? 'neutral'} label={r.tipo_movimiento} dot={false} size="sm" fixedWidth />
                  </td>
                  <td className="px-3 py-2">
                    <p className="text-xs font-semibold text-content-primary truncate max-w-[200px]">{r.item_nombre ?? '—'}</p>
                    {r.item_codigo && <p className="text-[10px] font-mono text-content-tertiary">{r.item_codigo}</p>}
                  </td>
                  <td className="px-3 py-2 text-xs text-content-tertiary">{r.bodega_nombre ?? '—'}</td>
                  <td className="px-3 py-2 text-right text-xs font-mono tabular-nums text-content-secondary">{Number(r.cantidad ?? 0).toLocaleString('es-CO')}</td>
                  <td className="px-3 py-2 text-[11px]">
                    <span className="font-mono text-content-tertiary">{r.referencia_tipo ?? '—'}</span>
                    {r.referencia_id && <span className="text-content-muted ml-1">#{r.referencia_id}</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-content-secondary truncate max-w-[140px]">{r.responsable ?? 'sistema'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager meta={meta} onPage={(p) => setFilters((prev) => ({ ...prev, page: p }))} />
    </div>
  );
};

// ── Tab principal ────────────────────────────────────────────────────────────
const SUBTABS = [
  { key: 'login',       label: 'Intentos de login',    icon: ShieldAlert },
  { key: 'movimientos', label: 'Movimientos de stock', icon: ArrowDownUp },
];

const AuditoriaTab = () => {
  const user    = useBoundStore((s) => s.user);
  const esAdmin = user?.rol === 'admin';
  const [sub, setSub] = useState('login');

  if (!esAdmin) {
    return (
      <div className="bg-surface-base border border-border-base rounded-xl shadow-card p-8">
        <EmptyState
          icon={AlertCircle}
          title="Acceso restringido"
          description="La auditoría solo es visible para administradores."
          size="md"
        />
      </div>
    );
  }

  return (
    <div className="bg-surface-base border border-border-base rounded-xl shadow-card overflow-hidden">
      <div className="flex items-start gap-3 px-5 py-4 border-b border-border-subtle">
        <IconBox icon={ShieldCheck} tone="success" variant="subtle" size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-content-primary">Auditoría del sistema</h3>
          <p className="text-xs text-content-tertiary mt-0.5">
            Trazabilidad de accesos y de cada cambio de stock con responsable e IP.
          </p>
        </div>
      </div>

      <div className="px-5 pt-3 border-b border-border-subtle">
        <PageTabs tabs={SUBTABS} value={sub} onChange={setSub} variant="underline" size="sm" />
      </div>

      {sub === 'login'       && <LoginAttemptsSubtab />}
      {sub === 'movimientos' && <MovimientosSubtab />}
    </div>
  );
};

export default AuditoriaTab;
