import { AlertTriangle, CheckCircle2, Layers } from 'lucide-react';
import { fmt } from '../../../../utils/formatters';

// ── Hero del costo total ─────────────────────────────────────────────────────
const HeroCosto = ({ total, precioVenta, margen, estado, volumenBase }) => {
  if (estado !== 'completo') {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-semantic-warning-subtle to-surface-base border border-semantic-warning/30 p-5">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-semantic-warning-subtle flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-semantic-warning-fg" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-widest font-bold text-semantic-warning-fg mb-1">
              No calculable
            </p>
            <p className="text-base font-bold text-content-primary mb-1">
              Faltan proveedores en algunos ingredientes
            </p>
            <p className="text-xs text-content-secondary mb-2">
              Vinculá un proveedor a cada materia prima desde Sincronización para ver el costo final.
            </p>
            {volumenBase > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-surface-base/60 border border-semantic-warning/20">
                <Layers size={10} className="text-semantic-warning-fg" />
                <span className="text-[10px] font-bold text-content-secondary uppercase tracking-wider">
                  Esta receta rinde{' '}
                  <span className="tabular-nums text-content-primary">{volumenBase}</span> gal
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-content-primary to-content-secondary text-content-inverse p-5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary opacity-10 rounded-full -mr-12 -mt-12" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-content-inverse/60 mb-1">
            Costo por galón
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight">
            {fmt(total)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-pill bg-content-inverse/10 backdrop-blur-sm">
              <CheckCircle2 size={11} className="text-brand-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-content-inverse">Listo para costear</span>
            </div>
            {volumenBase > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-brand-primary/20 backdrop-blur-sm">
                <Layers size={10} className="text-brand-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-content-inverse">
                  Rinde <span className="tabular-nums text-brand-primary">{volumenBase}</span> gal por receta
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest font-bold text-content-inverse/60 mb-1">
            Precio sugerido
          </p>
          <p className="text-2xl font-bold tabular-nums text-brand-primary">
            {fmt(precioVenta)}
          </p>
          <p className="text-[10px] text-content-inverse/60 mt-1">
            por galón · margen {margen}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeroCosto;
