import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Bell, BellOff, Check, CheckCheck, Receipt, ShoppingBag,
  AlertTriangle, FileWarning, GitMerge, Info, X,
} from 'lucide-react';
import cn from '../../../utils/cn';
import { formatLetterDate } from '../../../utils/formatters';
import {
  useNotificaciones,
  useMarcarLeida,
  useMarcarTodasLeidas,
} from '../api/useNotificaciones';

// Iconos por tipo
const TIPO_ICON = {
  factura_vencimiento: Receipt,
  oc_retrasada:        ShoppingBag,
  mp_critica:          AlertTriangle,
  requisicion_nueva:   FileWarning,
  item_huerfano:       GitMerge,
  info:                Info,
};

const TIPO_TONE = {
  factura_vencimiento: 'text-semantic-warning-fg bg-semantic-warning-subtle/60',
  oc_retrasada:        'text-semantic-danger-fg  bg-semantic-danger-subtle/60',
  mp_critica:          'text-semantic-danger-fg  bg-semantic-danger-subtle/60',
  requisicion_nueva:   'text-semantic-info-fg    bg-semantic-info-subtle/60',
  item_huerfano:       'text-brand-primary-active bg-brand-subtle',
  info:                'text-content-secondary bg-surface-muted',
};

const fmtRelative = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso.replace(' ', 'T'));
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60)        return 'Ahora';
    if (diff < 3600)      return `Hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400)     return `Hace ${Math.floor(diff / 3600)} h`;
    if (diff < 86400 * 7) return `Hace ${Math.floor(diff / 86400)} d`;
    return formatLetterDate(iso.split(' ')[0] ?? iso.split('T')[0]);
  } catch { return iso; }
};

const NotificacionItem = ({ notif, onClick }) => {
  const Icon = TIPO_ICON[notif.tipo] ?? Info;
  const toneCls = TIPO_TONE[notif.tipo] ?? TIPO_TONE.info;

  return (
    <button
      type="button"
      onClick={() => onClick(notif)}
      className={cn(
        'w-full text-left flex gap-3 px-3 py-2.5 transition-colors border-l-2',
        notif.leida
          ? 'border-l-transparent hover:bg-surface-subtle'
          : 'border-l-brand-primary bg-brand-subtle/20 hover:bg-brand-subtle/40',
      )}
    >
      <div className={cn('shrink-0 w-8 h-8 rounded-full flex items-center justify-center', toneCls)}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-xs truncate', notif.leida ? 'font-medium text-content-secondary' : 'font-bold text-content-primary')}>
            {notif.titulo}
          </p>
          {!notif.leida && (
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-brand-primary" />
          )}
        </div>
        {notif.mensaje && (
          <p className="text-[11px] text-content-tertiary mt-0.5 line-clamp-2 leading-relaxed">
            {notif.mensaje}
          </p>
        )}
        <p className="text-[10px] text-content-muted mt-1">{fmtRelative(notif.created_at)}</p>
      </div>
    </button>
  );
};

const NotificacionesDropdown = () => {
  const [open, setOpen] = useState(false);
  const containerRef    = useRef(null);
  const navigate        = useNavigate();

  const { data, isLoading } = useNotificaciones({ enabled: true });
  const { mutate: marcarLeida }       = useMarcarLeida();
  const { mutate: marcarTodasLeidas, isPending: isMarcandoTodas } = useMarcarTodasLeidas();

  const items   = data?.data ?? [];
  const noLeidas = data?.no_leidas ?? 0;

  // Cerrar al click fuera
  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const handleClick = (notif) => {
    if (!notif.leida) marcarLeida(notif.id);
    if (notif.link) navigate(notif.link);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 hover:bg-surface-sidebar-hover rounded-full transition-colors text-content-muted hover:text-content-inverse"
        title={noLeidas > 0 ? `${noLeidas} notificación(es) sin leer` : 'Notificaciones'}
      >
        <Bell size={16} />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-semantic-danger text-white text-[9px] font-bold flex items-center justify-center border-2 border-surface-sidebar tabular-nums">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 w-96 max-h-[80vh] flex flex-col z-[200]',
            'bg-surface-base border border-border-base rounded-xl shadow-2xl overflow-hidden',
            'animate-in fade-in slide-in-from-top-2 duration-150',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-surface-subtle">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-content-secondary" />
              <h3 className="text-sm font-semibold text-content-primary">Notificaciones</h3>
              {noLeidas > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-semantic-danger text-white text-[10px] font-bold tabular-nums">
                  {noLeidas}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {noLeidas > 0 && (
                <button
                  type="button"
                  onClick={() => marcarTodasLeidas()}
                  disabled={isMarcandoTodas}
                  title="Marcar todas como leídas"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-content-tertiary hover:text-content-primary px-1.5 py-1 rounded-md hover:bg-surface-muted transition-colors disabled:opacity-50"
                >
                  <CheckCheck size={11} /> Leer todas
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-muted"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-md bg-surface-muted animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                <div className="w-12 h-12 rounded-xl bg-surface-muted flex items-center justify-center mb-3">
                  <BellOff size={20} className="text-content-muted opacity-70" />
                </div>
                <p className="text-sm font-semibold text-content-secondary">Sin notificaciones</p>
                <p className="text-xs text-content-muted mt-1">Te avisaremos de eventos importantes acá.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border-subtle">
                {items.map((n) => (
                  <li key={n.id}>
                    <NotificacionItem notif={n} onClick={handleClick} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-4 py-2 border-t border-border-subtle bg-surface-subtle text-center">
              <p className="text-[10px] text-content-muted">
                Se actualiza automáticamente cada 30 segundos
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificacionesDropdown;
