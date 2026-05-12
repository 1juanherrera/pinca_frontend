import {
  Building2, Phone, Mail, MapPin, FileText,
  MoreVertical, Pencil, Trash2, Eye, Package,
} from 'lucide-react';
import { useState } from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────
const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

const AVATAR_PALETTES = [
  { bg: 'bg-semantic-info',    ring: 'ring-semantic-info/30',    text: 'text-semantic-info-fg',    light: 'bg-semantic-info-subtle'    },
  { bg: 'bg-brand-primary-active',  ring: 'ring-brand-primary/30',   text: 'text-brand-primary-active',  light: 'bg-brand-subtle'  },
  { bg: 'bg-semantic-info',    ring: 'ring-semantic-info/30',     text: 'text-semantic-info-fg',    light: 'bg-semantic-info-subtle'    },
  { bg: 'bg-semantic-warning',   ring: 'ring-semantic-warning/40',    text: 'text-semantic-warning-fg',   light: 'bg-semantic-warning-subtle'   },
  { bg: 'bg-semantic-danger',    ring: 'ring-semantic-danger/30',     text: 'text-semantic-danger-fg',    light: 'bg-semantic-danger-subtle'    },
  { bg: 'bg-semantic-success', ring: 'ring-semantic-success/30',  text: 'text-semantic-success-fg', light: 'bg-semantic-success-subtle' },
];
const getPalette = (id) => AVATAR_PALETTES[Number(id) % AVATAR_PALETTES.length];

// ── Dropdown de acciones ───────────────────────────────────────────────────
const ActionsMenu = ({ onEdit, onDelete }) => {
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
              onClick={() => { setOpen(false); onEdit?.(); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Pencil size={14} className="text-slate-400" /> Editar
            </button>
            <div className="my-1 border-t border-slate-100" />
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

// ── ProveedorCard ──────────────────────────────────────────────────────────
const ProveedorCard = ({ proveedor, totalProductos = null, onEdit, onDelete }) => {
  const palette     = getPalette(proveedor.id_proveedor);
  const displayName = proveedor.nombre_empresa || proveedor.nombre_encargado;

  return (
    <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">

      {/* Franja de color */}
      <div className={`h-1.5 w-full ${palette.bg}`} />

      {/* Cabecera */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">

          <div className="flex items-center gap-3 min-w-0">
            <div className={`shrink-0 w-11 h-11 rounded-xl ${palette.bg} flex items-center justify-center text-white text-sm font-bold ring-2 ${palette.ring} ring-offset-1`}>
              {getInitials(displayName)}
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                {displayName}
              </h3>
              {proveedor.nombre_empresa && (
                <p className="text-xs text-slate-500 mt-0.5 truncate">{proveedor.nombre_encargado}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-semantic-info-subtle text-semantic-info-fg border-semantic-info/20">
              <Building2 size={10} /> Proveedor
            </span>
            <ActionsMenu onEdit={onEdit} onDelete={onDelete} />
          </div>
        </div>
      </div>

      {/* Separador */}
      <div className="mx-5 border-t border-slate-100" />

      {/* Contacto */}
      <div className="px-5 py-3 space-y-2">
        {proveedor.numero_documento && (
          <div className="flex items-center gap-2.5">
            <FileText size={13} className="text-slate-300 shrink-0" />
            <span className="text-xs  text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
              {proveedor.numero_documento}
            </span>
          </div>
        )}

        {proveedor.telefono && (
          <div className="flex items-center gap-2.5">
            <Phone size={13} className="text-slate-300 shrink-0" />
            <a
              href={`tel:${proveedor.telefono}`}
              className="text-xs text-slate-600 hover:text-semantic-info-fg transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {proveedor.telefono}
            </a>
          </div>
        )}

        {proveedor.email && (
          <div className="flex items-center gap-2.5 min-w-0">
            <Mail size={13} className="text-slate-300 shrink-0" />
            <a
              href={`mailto:${proveedor.email}`}
              className="text-xs text-slate-600 hover:text-semantic-info-fg transition-colors truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {proveedor.email}
            </a>
          </div>
        )}

        {proveedor.direccion && (
          <div className="flex items-start gap-2.5">
            <MapPin size={13} className="text-slate-300 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
              {proveedor.direccion}
            </p>
          </div>
        )}
      </div>

      {/* Productos en catálogo */}
      {totalProductos !== null && (
        <>
          <div className="mx-5 border-t border-slate-100" />
          <div className="px-5 py-3">
            <div className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 ${palette.light}`}>
              <Package size={15} className={palette.text} />
              <div>
                <p className="text-xs text-slate-500 leading-none">Productos en catálogo</p>
                <p className={`text-sm font-bold mt-0.5 ${palette.text}`}>{totalProductos}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mx-5 border-t border-slate-100" />
      <div className="px-5 py-3 flex items-center justify-end">
        <span className="text-xs  text-slate-300">
          #{String(proveedor.id_proveedor).padStart(4, '0')}
        </span>
      </div>
    </div>
  );
};

export default ProveedorCard;