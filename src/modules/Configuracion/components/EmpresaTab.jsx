import { useMemo, useRef, useState } from 'react';
import { Building2, Save, RotateCcw, Globe, DollarSign, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../../shared/Button';
import IconBox from '../../../shared/IconBox';
import { useBoundStore } from '../../../store/useBoundStore';
import { useEmpresa, useUpdateEmpresa, useUploadLogo, useDeleteLogo } from '../api/useEmpresa';

// Base URL del backend (sin /api). El logo_path viene como /uploads/empresa/x.png
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '');

const FIELDS = [
  { key: 'razon_social', label: 'Razón social', placeholder: 'PINTURAS INDUSTRIALES DEL CARIBE S.A.S' },
  { key: 'nit',          label: 'NIT',          placeholder: '901314182', max: 11 },
  { key: 'descripcion',  label: 'Descripción / objeto social', placeholder: 'Comercio al por mayor de…', textarea: true },
  { key: 'direccion',    label: 'Dirección',    placeholder: 'Calle 99 # 6-59' },
  { key: 'ciudad',       label: 'Ciudad',       placeholder: 'Barranquilla' },
  { key: 'telefono',     label: 'Teléfono fijo', placeholder: '3145973532' },
  { key: 'celular',      label: 'Celular',      placeholder: '+57 3019794729' },
  { key: 'email',        label: 'Email',        placeholder: 'pinca.sas@hotmail.com' },
  { key: 'pagina_web',   label: 'Página web',   placeholder: 'https://pinca.com.co/' },
];

const LOCALE_OPTIONS = [
  { value: 'es-CO', label: 'Español (Colombia)' },
  { value: 'es-MX', label: 'Español (México)'   },
  { value: 'es-AR', label: 'Español (Argentina)' },
  { value: 'es-ES', label: 'Español (España)'   },
  { value: 'en-US', label: 'English (US)'       },
];
const MONEDA_OPTIONS = [
  { value: 'COP', label: 'COP — Peso colombiano' },
  { value: 'MXN', label: 'MXN — Peso mexicano'   },
  { value: 'ARS', label: 'ARS — Peso argentino'  },
  { value: 'USD', label: 'USD — Dólar'           },
  { value: 'EUR', label: 'EUR — Euro'            },
];

const EmpresaTab = () => {
  const user    = useBoundStore((s) => s.user);
  const esAdmin = user?.rol === 'admin';

  const { data, isLoading } = useEmpresa();
  const { mutate: actualizar, isPending } = useUpdateEmpresa();
  const { mutate: subirLogo, isPending: isUploading } = useUploadLogo();
  const { mutate: borrarLogo, isPending: isDeleting } = useDeleteLogo();

  const fileInputRef = useRef(null);

  const originales = useMemo(() => {
    if (!data) return {};
    return {
      ...FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: data[f.key] ?? '' }), {}),
      locale: data.locale ?? 'es-CO',
      moneda: data.moneda ?? 'COP',
    };
  }, [data]);

  const [overrides, setOverrides] = useState({});
  const form = useMemo(() => ({ ...originales, ...overrides }), [originales, overrides]);

  const dirty = useMemo(
    () => Object.keys(overrides).some((k) => overrides[k] !== originales[k]),
    [overrides, originales]
  );
  const setField = (k, v) => setOverrides((p) => ({ ...p, [k]: v }));
  const handleReset = () => setOverrides({});
  const handleSave  = () => {
    if (dirty && esAdmin) actualizar(form, { onSuccess: () => setOverrides({}) });
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('El archivo excede 2 MB.');
      e.target.value = '';
      return;
    }
    subirLogo(file);
    e.target.value = '';
  };

  const logoUrl = data?.logo_path ? `${API_BASE}${data.logo_path}` : null;

  if (isLoading) {
    return (
      <div className="bg-surface-base border border-border-base rounded-xl shadow-card p-6 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 bg-surface-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-surface-base border border-border-base rounded-xl shadow-card overflow-hidden">
      <div className="flex items-start gap-3 px-5 py-4 border-b border-border-subtle">
        <IconBox icon={Building2} tone="brand" variant="subtle" size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-content-primary">Datos de la empresa</h3>
          <p className="text-xs text-content-tertiary mt-0.5">
            Estos datos aparecen en headers de PDFs (cotizaciones, remisiones, producción), encabezados de exports y reportes.
          </p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Logo */}
        <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 p-4">
          <p className="text-[11px] font-semibold text-content-tertiary uppercase tracking-wider mb-3">
            Logo institucional
          </p>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border-base bg-surface-base flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo empresa" className="w-full h-full object-contain" />
              ) : (
                <ImageIcon size={28} className="text-content-muted" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-xs text-content-tertiary leading-snug">
                PNG, JPG o WEBP. Máximo 2&nbsp;MB. Aparece en headers de PDFs y reportes.
              </p>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                <Button
                  variant="primary" size="sm" icon={Upload}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!esAdmin || isUploading}
                  loading={isUploading}
                >
                  {logoUrl ? 'Reemplazar logo' : 'Subir logo'}
                </Button>
                {logoUrl && (
                  <Button
                    variant="ghost" size="sm" icon={Trash2}
                    onClick={() => borrarLogo()}
                    disabled={!esAdmin || isDeleting}
                    loading={isDeleting}
                  >
                    Quitar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Datos institucionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.textarea ? 'md:col-span-2' : ''}>
              <label className="block text-[11px] font-semibold text-content-secondary mb-1.5">{f.label}</label>
              {f.textarea ? (
                <textarea
                  rows={2}
                  value={form[f.key] ?? ''}
                  disabled={!esAdmin}
                  onChange={(e) => setField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:bg-surface-muted disabled:cursor-not-allowed"
                />
              ) : (
                <input
                  type="text"
                  value={form[f.key] ?? ''}
                  maxLength={f.max}
                  disabled={!esAdmin}
                  onChange={(e) => setField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:bg-surface-muted disabled:cursor-not-allowed"
                />
              )}
            </div>
          ))}
        </div>

        {/* Locale + Moneda */}
        <div className="rounded-xl border border-border-subtle bg-surface-subtle/40 p-4">
          <p className="text-[11px] font-semibold text-content-tertiary uppercase tracking-wider mb-3">
            Formato de números, fechas y moneda
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-content-secondary mb-1.5 inline-flex items-center gap-1.5">
                <Globe size={11} /> Locale
              </label>
              <select
                value={form.locale ?? 'es-CO'}
                disabled={!esAdmin}
                onChange={(e) => setField('locale', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:bg-surface-muted bg-surface-base"
              >
                {LOCALE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-content-secondary mb-1.5 inline-flex items-center gap-1.5">
                <DollarSign size={11} /> Moneda
              </label>
              <select
                value={form.moneda ?? 'COP'}
                disabled={!esAdmin}
                onChange={(e) => setField('moneda', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border-base rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/30 disabled:bg-surface-muted bg-surface-base"
              >
                {MONEDA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 px-5 py-3 bg-surface-subtle border-t border-border-subtle">
        {dirty && (
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={handleReset} disabled={isPending}>
            Descartar
          </Button>
        )}
        <Button
          variant="primary" size="sm" icon={Save}
          onClick={handleSave}
          disabled={!dirty || !esAdmin || isPending}
          loading={isPending}
        >
          Guardar cambios
        </Button>
      </div>
    </div>
  );
};

export default EmpresaTab;
