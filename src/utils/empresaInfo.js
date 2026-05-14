import { useEmpresa } from '../modules/Configuracion/api/useEmpresa';
import logoFallback from '../assets/pincaicono.png';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').replace(/\/api\/?$/, '');

/**
 * Shape esperado por los componentes de Export PDF / encabezados de reporte.
 * Mantiene compatibilidad con el formato hardcodeado original.
 */
export const EMPRESA_FALLBACK = Object.freeze({
  nombre:    'PINTURAS INDUSTRIALES DEL CARIBE S.A.S',
  nit:       'NIT 901.314.182-9',
  direccion: 'Calle 99 # 6-59',
  telefono:  'Tel: 3145973532',
  ciudad:    'Barranquilla - Colombia',
  email:     'pinca.sas@hotmail.com',
  celular:   '+57 3019794729',
  web:       'www.pinca.com.co',
});

/**
 * Mapea el row de la tabla `empresa` (backend) al shape que esperan los
 * componentes de export. Si falta data usa el fallback hardcoded.
 */
export const buildEmpresaShape = (e) => {
  if (!e) return EMPRESA_FALLBACK;
  return {
    nombre:    e.razon_social ?? EMPRESA_FALLBACK.nombre,
    nit:       e.nit ? `NIT ${e.nit}` : EMPRESA_FALLBACK.nit,
    direccion: e.direccion ?? EMPRESA_FALLBACK.direccion,
    telefono:  e.telefono ? `Tel: ${e.telefono}` : EMPRESA_FALLBACK.telefono,
    ciudad:    e.ciudad ? `${e.ciudad} - Colombia` : EMPRESA_FALLBACK.ciudad,
    email:     e.email ?? EMPRESA_FALLBACK.email,
    celular:   e.celular ?? EMPRESA_FALLBACK.celular,
    web:       e.pagina_web ?? EMPRESA_FALLBACK.web,
  };
};

/**
 * Hook listo para usar en cualquier componente: devuelve el shape de empresa
 * actualizado, con fallback al hardcoded mientras carga.
 */
export const useEmpresaInfo = () => {
  const { data } = useEmpresa();
  return buildEmpresaShape(data);
};

/**
 * Hook que devuelve la URL absoluta del logo (servida por el backend si fue
 * subido por admin, o el asset estático del frontend como fallback).
 */
export const useEmpresaLogoUrl = () => {
  const { data } = useEmpresa();
  if (data?.logo_path) return `${API_BASE}${data.logo_path}`;
  return logoFallback;
};
