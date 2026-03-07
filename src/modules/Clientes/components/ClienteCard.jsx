/* eslint-disable no-unused-vars */
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
  { bg: 'bg-blue-600',   ring: 'ring-blue-200',   text: 'text-blue-600',   light: 'bg-blue-50'   },
  { bg: 'bg-violet-600', ring: 'ring-violet-200',  text: 'text-violet-600', light: 'bg-violet-50' },
  { bg: 'bg-teal-600',   ring: 'ring-teal-200',    text: 'text-teal-600',   light: 'bg-teal-50'   },
  { bg: 'bg-amber-500',  ring: 'ring-amber-200',   text: 'text-amber-600',  light: 'bg-amber-50'  },
  { bg: 'bg-rose-600',   ring: 'ring-rose-200',    text: 'text-rose-600',   light: 'bg-rose-50'   },
  { bg: 'bg-emerald-600',ring: 'ring-emerald-200', text: 'text-emerald-600',light: 'bg-emerald-50'},
];
const getPalette = (id) => AVATAR_PALETTES[Number(id) % AVATAR_PALETTES.length];

// ── Dropdown de acciones ───────────────────────────────────────────────────
const ActionsMenu = ({ onView, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 w-44 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1">
            <button
              onClick={() => { setOpen(false); onView?.(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Eye size={14} className="text-slate-400" /> Ver detalle
            </button>
            <button
              onClick={() => { setOpen(false); onEdit?.(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Pencil size={14} className="text-slate-400" /> Editar
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button
              onClick={() => { setOpen(false); onDelete?.(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
      <p className="text-xs text-slate-500 leading-none">{label}</p>
      <p className={`text-sm font-bold mt-0.5 truncate ${palette.text}`}>{value}</p>
    </div>
  </div>
);

// ── ClienteCard ────────────────────────────────────────────────────────────
/**
 * Props:
 *  cliente        – objeto del cliente (estructura de tu API)
 *  onEdit         – fn callback
 *  onDelete       – fn callback
 *  onView         – fn callback (opcional, para ver detalle)
 *
 * Props de métricas opcionales (cuando las tengas en el backend):
 *  totalPedidos   – number
 *  totalCompras   – string | number  (ej: "$4.200.000")
 *  ultimaCompra   – string           (ej: "hace 3 días")
 */
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
    <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

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
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isActive ? 'bg-emerald-400' : 'bg-slate-300'}`} />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                {displayName}
              </h3>
              {cliente.nombre_empresa && (
                <p className="text-xs text-slate-500 mt-0.5 truncate">{cliente.nombre_encargado}</p>
              )}
            </div>
          </div>

          {/* Badges + menú */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Tipo badge */}
            <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
              isEmpresa
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {isEmpresa ? <Building2 size={10} /> : <User size={10} />}
              {isEmpresa ? 'Empresa' : 'Particular'}
            </span>

            <ActionsMenu onView={onView} onEdit={onEdit} onDelete={onDelete} />
          </div>
        </div>
      </div>

      {/* ── Separador ── */}
      <div className="mx-5 border-t border-slate-100" />

      {/* ── Info de contacto ── */}
      <div className="px-5 py-3 space-y-2">
        {cliente.numero_documento && (
          <div className="flex items-center gap-2.5">
            <FileText size={13} className="text-slate-300 shrink-0" />
            <span className="text-xs font-mono text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
              {cliente.numero_documento}
            </span>
          </div>
        )}

        {cliente.telefono && (
          <div className="flex items-center gap-2.5">
            <Phone size={13} className="text-slate-300 shrink-0" />
            <a
              href={`tel:${cliente.telefono}`}
              className="text-xs text-slate-600 hover:text-blue-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {cliente.telefono}
            </a>
          </div>
        )}

        {cliente.email && (
          <div className="flex items-center gap-2.5 min-w-0">
            <Mail size={13} className="text-slate-300 shrink-0" />
            <a
              href={`mailto:${cliente.email}`}
              className="text-xs text-slate-600 hover:text-blue-600 transition-colors truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {cliente.email}
            </a>
          </div>
        )}

        {cliente.direccion && (
          <div className="flex items-start gap-2.5">
            <MapPin size={13} className="text-slate-300 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
              {cliente.direccion}
            </p>
          </div>
        )}
      </div>

      {/* ── Métricas (opcionales) ── */}
      {hasMetrics && (
        <>
          <div className="mx-5 border-t border-slate-100" />
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
      <div className="mx-5 border-t border-slate-100" />
      <div className="px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isActive ? (
            <CheckCircle2 size={13} className="text-emerald-500" />
          ) : (
            <XCircle size={13} className="text-slate-300" />
          )}
          <span className={`text-xs font-semibold ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
            {isActive ? 'Cliente activo' : 'Inactivo'}
          </span>
        </div>

        <span className="text-xs font-mono text-slate-300">
          #{String(cliente.id_clientes).padStart(4, '0')}
        </span>
      </div>
    </div>
  );
};

export default ClienteCard;