import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import toast from 'react-hot-toast';

const rolesKeys = {
  all:      ['roles'],
  permisos: () => ['roles', 'permisos'],
  usuarios: () => ['roles', 'usuarios'],
};

export const usePermisos = () =>
  useQuery({
    queryKey: rolesKeys.permisos(),
    queryFn:  () => apiClient.get(API_ROUTES.ROLES.PERMISOS),
  });

export const useUpdatePermisos = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rol, modulos }) =>
      apiClient.put(API_ROUTES.ROLES.UPDATE_PERMISOS(rol), { modulos }),
    onSuccess: (_, { rol }) => {
      qc.invalidateQueries({ queryKey: rolesKeys.permisos() });
      toast.success(`Permisos de ${rol} actualizados`);
    },
    onError: (e) => toast.error(e?.message || 'Error al guardar permisos'),
  });
};

export const useUsuariosRoles = () =>
  useQuery({
    queryKey: rolesKeys.usuarios(),
    queryFn:  () => apiClient.get(API_ROUTES.ROLES.USUARIOS),
  });

export const useCambiarRol = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, rol }) =>
      apiClient.patch(API_ROUTES.ROLES.CAMBIAR_ROL(userId), { rol }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rolesKeys.usuarios() });
      toast.success('Rol actualizado');
    },
    onError: (e) => toast.error(e?.message || 'Error al cambiar rol'),
  });
};
