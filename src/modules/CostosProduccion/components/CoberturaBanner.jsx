import { useNavigate } from 'react-router';
import { Truck, AlertCircle, CheckCircle2, ExternalLink, GitBranch } from 'lucide-react';
import { cn } from '../../../utils/cn';

/**
 * Banner que muestra el % de MPs cubiertas por proveedor.
 * Tone shift por umbrales: <50 (warning fuerte), 50-90 (info), >90 (success discreto).
 */
const CoberturaBanner = ({ cobertura }) => {
  const navigate = useNavigate();
  const { mps_totales = 0, mps_cubiertas = 0, mps_sin_proveedor = 0, pct = 0 } = cobertura || {};

  if (mps_totales === 0) return null;

  // Determinar tone según %
  const tone = pct >= 90 ? 'success' : pct >= 50 ? 'info' : 'warning';

  const TONE_CLS = {
    success: {
      wrap:     'bg-semantic-success-subtle/40 border-semantic-success/30',
      iconBg:   'bg-semantic-success-subtle',
      iconText: 'text-semantic-success-fg',
      title:    'text-semantic-success-fg',
      bar:      'bg-semantic-success',
      Icon:     CheckCircle2,
      label:    'Cobertura saludable',
      message:  'La mayoría de tus materias primas tienen proveedor cargado.',
    },
    info: {
      wrap:     'bg-semantic-info-subtle/40 border-semantic-info/30',
      iconBg:   'bg-semantic-info-subtle',
      iconText: 'text-semantic-info-fg',
      title:    'text-semantic-info-fg',
      bar:      'bg-semantic-info',
      Icon:     Truck,
      label:    'Cobertura parcial',
      message:  'Faltan proveedores en algunas materias primas. Vinculá las restantes para ver costos.',
    },
    warning: {
      wrap:     'bg-semantic-warning-subtle/50 border-semantic-warning/40',
      iconBg:   'bg-semantic-warning-subtle',
      iconText: 'text-semantic-warning-fg',
      title:    'text-semantic-warning-fg',
      bar:      'bg-semantic-warning',
      Icon:     AlertCircle,
      label:    'Cobertura insuficiente',
      message:  'La mayoría de tus materias primas no tienen proveedor cargado. Sin esto no se pueden calcular costos.',
    },
  }[tone];

  return (
    <div className={cn('border rounded-2xl p-4 transition-colors', TONE_CLS.wrap)}>
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', TONE_CLS.iconBg)}>
          <TONE_CLS.Icon className={cn('w-5 h-5', TONE_CLS.iconText)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <p className={cn('text-sm font-bold', TONE_CLS.title)}>
              {TONE_CLS.label}
            </p>
            <p className="text-xs text-content-secondary tabular-nums">
              <span className="font-bold text-content-primary">{mps_cubiertas}</span>
              <span className="text-content-muted"> de </span>
              <span className="font-bold text-content-primary">{mps_totales}</span>
              <span className="text-content-muted"> MPs cubiertas · </span>
              <span className={cn('font-bold', TONE_CLS.title)}>{pct}%</span>
            </p>
          </div>

          {/* Barra de progreso */}
          <div className="mt-2 h-2 rounded-full bg-surface-base/60 overflow-hidden border border-border-base/40">
            <div
              className={cn('h-full rounded-full transition-all duration-500', TONE_CLS.bar)}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>

          <p className="mt-2.5 text-xs text-content-secondary">{TONE_CLS.message}</p>

          {tone !== 'success' && mps_sin_proveedor > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => navigate('/catalogo?tab=proveedores')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-base border border-border-base text-[11px] font-semibold text-content-primary hover:border-content-primary hover:shadow-sm transition"
              >
                <Truck size={11} /> Cargar proveedores
              </button>
              <button
                type="button"
                onClick={() => navigate('/sincronizacion')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-surface-base border border-border-base text-[11px] font-semibold text-content-primary hover:border-content-primary hover:shadow-sm transition"
              >
                <GitBranch size={11} /> Vincular existentes
                <ExternalLink size={9} className="text-content-muted" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoberturaBanner;
