import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../../api/apiClient';

const KEY = ['empresa'];

/**
 * Datos institucionales de la empresa (única fila en `empresa`).
 * Usar en headers de PDFs, footers, encabezados — todo viene de acá.
 */
export const useEmpresa = () =>
  useQuery({
    queryKey:  KEY,
    queryFn:   () => apiClient.get('/empresa'),
    staleTime: 30 * 60 * 1000, // empresa cambia muy rara vez
  });

export const useUpdateEmpresa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiClient.put('/empresa', data),
    onSuccess: () => { toast.success('Empresa actualizada'); qc.invalidateQueries({ queryKey: KEY }); },
    onError:   (e) => toast.error(e?.response?.data?.messages?.error || e?.response?.data?.msg || 'Error al actualizar empresa'),
  });
};

/**
 * Devuelve el logo como data URI base64 (lo necesita jsPDF para `addImage`).
 * El backend ya tiene el filtro CORS y JWT; evita el problema de fetch
 * directo a `/uploads/` que no envía headers CORS.
 */
export const useEmpresaLogoBase64 = () =>
  useQuery({
    queryKey:  ['empresa', 'logo-base64'],
    queryFn:   () => apiClient.get('/empresa/logo-base64'),
    staleTime: 30 * 60 * 1000,
  });

export const useUploadLogo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('logo', file);
      return apiClient.post('/empresa/logo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => { toast.success('Logo actualizado'); qc.invalidateQueries({ queryKey: KEY }); },
    onError:   (e) => toast.error(e?.response?.data?.messages?.error || e?.response?.data?.msg || 'Error al subir logo'),
  });
};

export const useDeleteLogo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete('/empresa/logo'),
    onSuccess: () => { toast.success('Logo eliminado'); qc.invalidateQueries({ queryKey: KEY }); },
    onError:   (e) => toast.error(e?.response?.data?.messages?.error || e?.response?.data?.msg || 'Error al eliminar logo'),
  });
};

/**
 * Formatters que respetan el locale y la moneda configurados en empresa.
 * Devuelve helpers listos: { fmtNum, fmtCOP, fmtFecha, fmtFechaHora, locale, moneda }.
 */
export const useEmpresaFormatters = () => {
  const { data } = useEmpresa();
  const locale = data?.locale ?? 'es-CO';
  const moneda = data?.moneda ?? 'COP';

  return {
    locale,
    moneda,
    fmtNum: (v, dec = 0) =>
      Number(v ?? 0).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: dec }),
    fmtMoneda: (v) =>
      Number(v ?? 0).toLocaleString(locale, { style: 'currency', currency: moneda, maximumFractionDigits: 0 }),
    fmtFecha: (d) =>
      d ? new Date(d).toLocaleDateString(locale) : '—',
    fmtFechaHora: (d) =>
      d ? `${new Date(d).toLocaleDateString(locale)} ${new Date(d).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}` : '—',
  };
};
