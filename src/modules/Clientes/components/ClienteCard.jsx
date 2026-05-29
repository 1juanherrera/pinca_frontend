import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ShoppingCart,
  Clock,
} from 'lucide-react';
import { useState } from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────

const getInitials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

// Paleta de colores para el avatar basada en el ID
const AVATAR_PALETTES = [
  { bg: 'bg-semantic-info',   ring: 'ring-semantic-info/30',   text: 'text-semantic-info-fg',   light: 'bg-semantic-info-subtle'   },
  { bg: 'bg-brand-primary-active', ring: 'ring-brand-primary/30',  text: 'text-brand-primary-active', light: 'bg-brand-subtle' },
  { bg: 'bg-semantic-info',   ring: 'ring-semantic-info/30',    text: 'text-semantic-info-fg',   light: 'bg-semantic-info-subtle'   },
  { bg: 'bg-semantic-warning',  ring: 'ring-semantic-warning/40',   text: 'text-semantic-warning-fg',  light: 'bg-semantic-warning-subtle'  },
  { bg: 'bg-semantic-danger',   ring: 'ring-semantic-danger/30',    text: 'text-semantic-danger-fg',   light: 'bg-semantic-danger-subtle'   },
  { bg: 'bg-semantic-success',ring: 'ring-semantic-success/30', text: 'text-semantic-success-fg',light: 'bg-semantic-success-subtle'},
];
const getPalette = (id) => AVATAR_PALETTES[Number(id) % AVATAR_PALETTES.length];

// ── Dropdown de acciones ───────────────────────────────────────────────────
const ActionsMenu = ({ onView, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-content-muted hover:text-content-secondary hover:bg-surface-muted transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 w-44 bg-surface-base border border-border-base rounded-xl shadow-xl overflow-hidden py-1">
            <button
              onClick={() => { setOpen(false); onView?.(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-content-secondary hover:bg-surface-subtle transition-colors"
            >
              <Eye size={14} className="text-content-muted" /> Ver detalle
            </button>
            <button
              onClick={() => { setOpen(false); onEdit?.(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-content-secondary hover:bg-surface-subtle transition-colors"
            >
              <Pencil size={14} className="text-content-muted" /> Editar
            </button>
            <div className="my-1 border-t border-border-subtle" />
            <button
              onClick={() => { setOpen(false); onDelete?.(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-semantic-danger-fg hover:bg-semantic-danger-subtle transition-colors"
            >
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ── Stat mini dentro de la card ────────────────────────────────────────────
const MiniStat = ({ icon: Icon, label, value, palette }) => (
  <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 ${palette.light}`}>
    <Icon size={15} className={palette.text} />
    <div className="min-w-0">
      <p className="text-xs text-content-tertiary leading-none">{label}</p>
      <p className={`text-sm font-bold mt-0.5 truncate ${palette.text}`}>{value}</p>
    </div>
  </div>
);

// ── ClienteCard ────────────────────────────────────────────────────────────
const ClienteCard = ({
  cliente,
  onEdit,
  onDelete,
  onView,
  totalPedidos  = null,
  totalCompras  = null,
  ultimaCompra  = null,
}) => {
  const palette = getPalette(cliente.id_clientes);
  const isActive = cliente.estado === '1';
  const isEmpresa = cliente.tipo === '2';
  const displayName = cliente.nombre_empresa || cliente.nombre_encargado;
  const hasMetrics = totalPedidos !== null || totalCompras !== null || ultimaCompra !== null;

  return (
    <div className="group relative bg-surface-base border border-border-base rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

      {/* ── Franja superior de color ── */}
      <div className={`h-1.5 w-full ${palette.bg}`} />

      {/* ── Cabecera ── */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">

          {/* Avatar + nombre */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`relative shrink-0 w-11 h-11 rounded-xl ${palette.bg} flex items-center justify-center text-white text-sm font-bold ring-2 ${palette.ring} ring-offset-1`}>
              {getInitials(displayName)}
              {/* Indicador de estado */}
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isActive ? 'bg-semantic-success/80' : 'bg-surface-strong'}`} />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-content-primary leading-tight truncate">
                {displayName}
              </h3>
              {cliente.nombre_empresa && (
                <p className="text-xs text-content-tertiary mt-0.5 truncate">{cliente.nombre_encargado}</p>
              )}
            </div>
          </div>

          {/* Badges + menú */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Tipo badge */}
            <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
              isEmpresa
                ? 'bg-semantic-info-subtle text-semantic-info-fg border-semantic-info/20'
                : 'bg-surface-muted text-content-secondary border-border-base'
            }`}>
              {isEmpresa ? <Building2 size={10} /> : <User size={10} />}
              {isEmpresa ? 'Empresa' : 'Particular'}
            </span>

            <ActionsMenu onView={onView} onEdit={onEdit} onDelete={onDelete} />
          </div>
        </div>
      </div>

      {/* ── Separador ── */}
      <div className="mx-5 border-t border-border-subtle" />

      {/* ── Info de contacto ── */}
      <div className="px-5 py-3 space-y-2">
        {cliente.numero_documento && (
          <div className="flex items-center gap-2.5">
            <FileText size={13} className="text-content-muted shrink-0" />
            <span className="text-xs  text-content-secondary bg-surface-subtle border border-border-base px-2 py-0.5 rounded-md">
              {cliente.numero_documento}
            </span>
          </div>
        )}

        {cliente.telefono && (
          <div className="flex items-center gap-2.5">
            <Phone size={13} className="text-content-muted shrink-0" />
            <a
              href={`tel:${cliente.telefono}`}
              className="text-xs text-content-secondary hover:text-semantic-info-fg transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {cliente.telefono}
            </a>
          </div>
        )}

        {cliente.email && (
          <div className="flex items-center gap-2.5 min-w-0">
            <Mail size={13} className="text-content-muted shrink-0" />
            <a
              href={`mailto:${cliente.email}`}
              className="text-xs text-content-secondary hover:text-semantic-info-fg transition-colors truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {cliente.email}
            </a>
          </div>
        )}

        {cliente.direccion && (
          <div className="flex items-start gap-2.5">
            <MapPin size={13} className="text-content-muted shrink-0 mt-0.5" />
            <p className="text-xs text-content-tertiary leading-relaxed line-clamp-2">
              {cliente.direccion}
            </p>
          </div>
        )}
      </div>

      {/* ── Métricas (opcionales) ── */}
      {hasMetrics && (
        <>
          <div className="mx-5 border-t border-border-subtle" />
          <div className="px-5 py-3 grid grid-cols-3 gap-2">
            {totalPedidos !== null && (
              <MiniStat
                icon={ShoppingCart}
                label="Pedidos"
                value={totalPedidos}
                palette={getPalette(0)}
              />
            )}
            {totalCompras !== null && (
              <MiniStat
                icon={TrendingUp}
                label="Compras"
                value={totalCompras}
                palette={getPalette(2)}
              />
            )}
            {ultimaCompra !== null && (
              <MiniStat
                icon={Clock}
                label="Última"
                value={ultimaCompra}
                palette={getPalette(3)}
              />
            )}
          </div>
        </>
      )}

      {/* ── Footer con estado ── */}
      <div className="mx-5 border-t border-border-subtle" />
      <div className="px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isActive ? (
            <CheckCircle2 size={13} className="text-semantic-success" />
          ) : (
            <XCircle size={13} className="text-content-muted" />
          )}
          <span className={`text-xs font-semibold ${isActive ? 'text-semantic-success-fg' : 'text-content-muted'}`}>
            {isActive ? 'Cliente activo' : 'Inactivo'}
          </span>
        </div>

        <span className="text-xs  text-content-muted">
          #{String(cliente.id_clientes).padStart(4, '0')}
        </span>
      </div>
    </div>
  );
};

export default ClienteCard;
