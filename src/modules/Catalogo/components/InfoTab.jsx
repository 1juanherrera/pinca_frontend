import { Pencil } from 'lucide-react';
import { fmt } from '../../../utils/formatters';
import { Button } from '../../../shared/Button';

const TIPO_LABELS = { 0: 'Producto Terminado', 1: 'Materia Prima', 2: 'Insumo' };

const FICHA_TECNICA = [
  { key: 'viscosidad',    label: 'Viscosidad' },
  { key: 'p_g',           label: 'Densidad / P.G.' },
  { key: 'color',         label: 'Color' },
  { key: 'brillo_60',     label: 'Brillo (60°)' },
  { key: 'secado',        label: 'Secado' },
  { key: 'cubrimiento',   label: 'Cubrimiento' },
  { key: 'molienda',      label: 'Molienda' },
  { key: 'ph',            label: 'pH' },
  { key: 'poder_tintoreo',label: 'Poder Tintóreo' },
];

const Field = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-sm font-semibold text-zinc-800">{value || '—'}</p>
  </div>
);

const InfoTab = ({ item, onEdit }) => {
  const hasFicha = FICHA_TECNICA.some(f => item[f.key]);

  return (
    <div className="p-6 space-y-6">

      {/* Datos básicos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest">Datos Generales</h3>
          <Button variant="white" size="sm" icon={Pencil} onClick={() => onEdit(item)}>
            Editar
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
          <Field label="Nombre"    value={item.nombre} />
          <Field label="Código"    value={item.codigo} />
          <Field label="Tipo"      value={TIPO_LABELS[Number(item.tipo)]} />
          <Field label="Categoría" value={item.categoria_nombre} />
          <Field label="Unidad de Venta"      value={item.unidad_nombre} />
          <Field label="Unidad de Almacenaje" value={item.unidad_almacenaje_nombre} />
          <Field label="Costo Promedio"        value={item.costo_unitario ? fmt(item.costo_unitario) : null} />
          <Field label="Precio de Venta"       value={item.precio_venta ? fmt(item.precio_venta) : null} />
        </div>
      </div>

      {/* Costos empaque */}
      {(item.envase || item.etiqueta || item.plastico) && (
        <div>
          <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest mb-3">Costos de Empaque</h3>
          <div className="grid grid-cols-3 gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
            <Field label="Envase"   value={item.envase   ? fmt(item.envase) : null} />
            <Field label="Etiqueta" value={item.etiqueta ? fmt(item.etiqueta) : null} />
            <Field label="Plástico" value={item.plastico ? fmt(item.plastico) : null} />
          </div>
        </div>
      )}

      {/* Ficha técnica */}
      {hasFicha && (
        <div>
          <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest mb-3">Ficha Técnica</h3>
          <div className="grid grid-cols-3 gap-0 border border-zinc-200 rounded-xl overflow-hidden">
            {FICHA_TECNICA.map(f => (
              <div
                key={f.key}
                className="flex flex-col p-3 border-r border-b border-zinc-200 last:border-r-0 bg-white"
              >
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">{f.label}</p>
                <p className="text-sm font-semibold text-zinc-800">{item[f.key] || '—'}</p>
              </div>
            ))}
          </div>
          <div className="p-2 bg-zinc-50 border-x border-b border-zinc-200 rounded-b-xl">
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-1 bg-zinc-300 rounded-full" />
              Especificaciones Técnicas Pinca S.A.S.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoTab;
