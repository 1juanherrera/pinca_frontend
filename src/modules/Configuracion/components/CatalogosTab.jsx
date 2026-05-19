import { useState, useMemo } from 'react';
import {
  Layers, Tag, Ruler, ArrowDownUp, Plus, Edit, Trash2, Save, Check,
} from 'lucide-react';
import { Button } from '../../../shared/Button';
import StatusBadge from '../../../shared/StatusBadge';
import IconBox from '../../../shared/IconBox';
import EmptyState from '../../../shared/EmptyState';
import Modal from '../../../shared/Modal';
import PageTabs from '../../../shared/PageTabs';
import { useBoundStore } from '../../../store/useBoundStore';
import {
  useCategorias,    useCategoriaCrud,
  useUnidades,      useUnidadCrud,
  useTiposMovimiento,
} from '../api/useCatalogosMaestros';

// ── Modal genérico CRUD ──────────────────────────────────────────────────────
const ItemModal = ({ titulo, item, fields, onSave, onClose, isSaving }) => {
  const [form, setForm] = useState(() =>
    fields.reduce((acc, f) => ({ ...acc, [f.key]: item?.[f.key] ?? f.default ?? '' }), {})
  );
  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const valido   = fields.every((f) => !f.required || String(form[f.key] ?? '').trim() !== '');

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="md"
      title={titulo}
      icon={Layers}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button variant="primary" icon={Save} onClick={() => valido && onSave(form)} loading={isSaving} disabled={!valido}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="p-1 space-y-3">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-[11px] font-semibold text-content-secondary mb-1.5">
              {f.label}{f.required && <span className="text-semantic-danger ml-0.5">*</span>}
            </label>
            <input
              type={f.type ?? 'text'}
              value={form[f.key] ?? ''}
              onChange={(e) => setField(f.key, f.type === 'number' ? e.target.value : e.target.value)}
              placeholder={f.placeholder}
              step={f.step}
              className="w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            />
            {f.hint && <p className="text-[10px] text-content-muted mt-1">{f.hint}</p>}
          </div>
        ))}
      </div>
    </Modal>
  );
};

// ── Categorías ───────────────────────────────────────────────────────────────
const CategoriasSubtab = ({ esAdmin }) => {
  const { data: rows = [], isLoading } = useCategorias();
  const { crear, actualizar, eliminar } = useCategoriaCrud();
  const openConfirm = useBoundStore((s) => s.openConfirm);
  const [editando, setEditando] = useState(null);
  const [creando,  setCreando]  = useState(false);

  const fields = [
    { key: 'nombre', label: 'Nombre', required: true, placeholder: 'Ej. ESMALTE' },
  ];

  const handleSave = (form) => {
    if (editando) actualizar.mutate({ id: editando.id_categoria, data: form }, { onSuccess: () => setEditando(null) });
    else          crear.mutate(form, { onSuccess: () => setCreando(false) });
  };

  if (isLoading) {
    return <div className="space-y-2 p-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-10 bg-surface-muted rounded animate-pulse" />)}</div>;
  }

  return (
    <div>
      {esAdmin && (
        <div className="px-4 py-3 border-b border-border-subtle">
          <Button size="sm" variant="primary" icon={Plus} onClick={() => setCreando(true)}>Nueva categoría</Button>
        </div>
      )}
      {rows.length === 0 ? (
        <div className="p-8"><EmptyState icon={Tag} title="Sin categorías" description="Creá la primera para clasificar los items." size="sm" /></div>
      ) : (
        <table className="w-full">
          <thead className="bg-surface-muted border-b border-border-base">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] font-semibold text-content-tertiary uppercase tracking-wider w-16">ID</th>
              <th className="px-4 py-2 text-left text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Nombre</th>
              {esAdmin && <th className="px-4 py-2 text-right text-[10px] font-semibold text-content-tertiary uppercase tracking-wider w-24">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {rows.map((r) => (
              <tr key={r.id_categoria} className="hover:bg-surface-subtle">
                <td className="px-4 py-2 text-xs font-mono text-content-tertiary tabular-nums">{r.id_categoria}</td>
                <td className="px-4 py-2 text-xs font-semibold text-content-primary">{r.nombre}</td>
                {esAdmin && (
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => setEditando(r)} title="Editar"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-white hover:border-content-primary transition-all">
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() => openConfirm({
                          title: 'Eliminar categoría',
                          message: `¿Eliminar "${r.nombre}"? Items con esta categoría quedarán sin clasificar.`,
                          variant: 'danger',
                          onConfirm: async () => await eliminar.mutateAsync(r.id_categoria),
                        })}
                        title="Eliminar"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-semantic-danger hover:text-white hover:border-semantic-danger transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editando && <ItemModal titulo={`Editar categoría · ${editando.nombre}`} item={editando} fields={fields} onSave={handleSave} onClose={() => setEditando(null)} isSaving={actualizar.isPending} />}
      {creando  && <ItemModal titulo="Nueva categoría" item={null} fields={fields} onSave={handleSave} onClose={() => setCreando(false)} isSaving={crear.isPending} />}
    </div>
  );
};

// ── Unidades ─────────────────────────────────────────────────────────────────
const UnidadesSubtab = ({ esAdmin }) => {
  const { data: rows = [], isLoading } = useUnidades();
  const { crear, actualizar, eliminar } = useUnidadCrud();
  const openConfirm = useBoundStore((s) => s.openConfirm);
  const [editando, setEditando] = useState(null);
  const [creando,  setCreando]  = useState(false);

  const fields = [
    { key: 'nombre',      label: 'Nombre',      required: true,  placeholder: 'Ej. KILO' },
    { key: 'descripcion', label: 'Descripción', placeholder: 'Opcional' },
    { key: 'escala',      label: 'Escala (factor a unidad base)', type: 'number', step: '0.0001', default: 1, hint: 'Ej. 1 GALÓN = 0.005 TAMBORES → escala = 1 si la base es GALÓN; o si KILO es base, KILO=1 y BULTO=25.' },
  ];

  const handleSave = (form) => {
    const payload = { ...form, escala: Number(form.escala) || 1, estados: 1 };
    if (editando) actualizar.mutate({ id: editando.id_unidad, data: payload }, { onSuccess: () => setEditando(null) });
    else          crear.mutate(payload, { onSuccess: () => setCreando(false) });
  };

  if (isLoading) {
    return <div className="space-y-2 p-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-10 bg-surface-muted rounded animate-pulse" />)}</div>;
  }

  return (
    <div>
      {esAdmin && (
        <div className="px-4 py-3 border-b border-border-subtle">
          <Button size="sm" variant="primary" icon={Plus} onClick={() => setCreando(true)}>Nueva unidad</Button>
        </div>
      )}
      {rows.length === 0 ? (
        <div className="p-8"><EmptyState icon={Ruler} title="Sin unidades" description="Creá la primera unidad de medida." size="sm" /></div>
      ) : (
        <table className="w-full">
          <thead className="bg-surface-muted border-b border-border-base">
            <tr>
              <th className="px-4 py-2 text-left text-[10px] font-semibold text-content-tertiary uppercase tracking-wider w-16">ID</th>
              <th className="px-4 py-2 text-left text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Nombre</th>
              <th className="px-4 py-2 text-left text-[10px] font-semibold text-content-tertiary uppercase tracking-wider">Descripción</th>
              <th className="px-4 py-2 text-right text-[10px] font-semibold text-content-tertiary uppercase tracking-wider w-24">Escala</th>
              {esAdmin && <th className="px-4 py-2 text-right text-[10px] font-semibold text-content-tertiary uppercase tracking-wider w-24">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {rows.map((r) => (
              <tr key={r.id_unidad} className="hover:bg-surface-subtle">
                <td className="px-4 py-2 text-xs font-mono text-content-tertiary tabular-nums">{r.id_unidad}</td>
                <td className="px-4 py-2 text-xs font-semibold text-content-primary uppercase">{r.nombre}</td>
                <td className="px-4 py-2 text-xs text-content-tertiary">{r.descripcion || '—'}</td>
                <td className="px-4 py-2 text-right text-xs font-mono tabular-nums text-content-secondary">{Number(r.escala ?? 1).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 5 })}</td>
                {esAdmin && (
                  <td className="px-4 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => setEditando(r)} title="Editar"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-content-primary hover:text-white hover:border-content-primary transition-all">
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() => openConfirm({
                          title: 'Eliminar unidad',
                          message: `¿Eliminar "${r.nombre}"? Esta acción puede afectar items y conversiones existentes.`,
                          variant: 'danger',
                          onConfirm: async () => await eliminar.mutateAsync(r.id_unidad),
                        })}
                        title="Eliminar"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-base text-content-tertiary hover:bg-semantic-danger hover:text-white hover:border-semantic-danger transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editando && <ItemModal titulo={`Editar unidad · ${editando.nombre}`} item={editando} fields={fields} onSave={handleSave} onClose={() => setEditando(null)} isSaving={actualizar.isPending} />}
      {creando  && <ItemModal titulo="Nueva unidad" item={null} fields={fields} onSave={handleSave} onClose={() => setCreando(false)} isSaving={crear.isPending} />}
    </div>
  );
};

// ── Tipos de movimiento (read-only) ──────────────────────────────────────────
const TiposMovimientoSubtab = () => {
  const { data, isLoading } = useTiposMovimiento();
  if (isLoading) return <div className="p-6 space-y-2">{Array.from({length:4}).map((_,i)=><div key={i} className="h-10 bg-surface-muted rounded animate-pulse" />)}</div>;

  return (
    <div className="p-5 space-y-5">
      <div>
        <p className="text-[11px] font-semibold text-content-tertiary uppercase tracking-wider mb-2">Tipos</p>
        <div className="flex flex-wrap gap-2">
          {data?.tipos?.map((t) => (
            <StatusBadge key={t.key} tone={t.tone} label={t.label} dot={false} size="sm" />
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-content-tertiary uppercase tracking-wider mb-2">Referencias (origen del movimiento)</p>
        <div className="flex flex-wrap gap-2">
          {data?.referencias?.map((r) => (
            <StatusBadge key={r.key} tone="neutral" label={r.label} dot={false} size="sm" />
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border-subtle bg-surface-subtle/40 p-3 text-[11px] text-content-tertiary leading-relaxed">
        Estos valores son <strong>constantes del sistema</strong> definidas en <code>MovimientoInventarioModel</code>.
        Aparecen en la columna "Tipo" y "Referencia" del kardex de movimientos. No se pueden editar desde aquí.
      </div>
    </div>
  );
};

// ── Tab principal ────────────────────────────────────────────────────────────
const SUBTABS = [
  { key: 'categorias', label: 'Categorías',         icon: Tag },
  { key: 'unidades',   label: 'Unidades de medida', icon: Ruler },
  { key: 'tipos',      label: 'Tipos de movimiento', icon: ArrowDownUp },
];

const CatalogosTab = () => {
  const user    = useBoundStore((s) => s.user);
  const esAdmin = user?.rol === 'admin';
  const [sub, setSub] = useState('categorias');

  return (
    <div className="bg-surface-base border border-border-base rounded-xl shadow-card overflow-hidden">
      <div className="flex items-start gap-3 px-5 py-4 border-b border-border-subtle">
        <IconBox icon={Layers} tone="brand" variant="subtle" size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-content-primary">Catálogos maestros</h3>
          <p className="text-xs text-content-tertiary mt-0.5">
            Listas de referencia que alimentan los formularios del sistema.
          </p>
        </div>
      </div>

      <div className="px-5 pt-3 border-b border-border-subtle">
        <PageTabs tabs={SUBTABS} value={sub} onChange={setSub} variant="underline" size="sm" />
      </div>

      <div>
        {sub === 'categorias' && <CategoriasSubtab esAdmin={esAdmin} />}
        {sub === 'unidades'   && <UnidadesSubtab   esAdmin={esAdmin} />}
        {sub === 'tipos'      && <TiposMovimientoSubtab />}
      </div>
    </div>
  );
};

export default CatalogosTab;
