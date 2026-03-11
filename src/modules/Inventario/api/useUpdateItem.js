import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { inventarioKeys } from './inventarioKeys';
import toast from 'react-hot-toast';

export const useUpdateItem = (id_bodega) => {
  const queryClient = useQueryClient();

  // Normalizar siempre — useParams devuelve string, pero byBodegaBase hace .toString()
  // así que ambos lados deben coincidir
  const bodegaId = id_bodega?.toString();

  return useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/bodegas/item/${id}`, data),

    onSuccess: (_response, { id, data }) => {
      // Actualizar optimistamente el cache
      queryClient.setQueriesData(
        { queryKey: inventarioKeys.byBodegaBase(bodegaId) },
        (old) => {
          if (!old?.inventario) return old;

          return {
            ...old,
            inventario: old.inventario.map((item) => {
              if (String(item.id_item_general) !== String(id)) return item;

              return {
                ...item,
                nombre:   data.nombre   ?? item.nombre,
                codigo:   data.codigo   ?? item.codigo,
                tipo:     data.tipo     ?? item.tipo,
                cantidad: data.cantidad ?? item.cantidad,
                formulacion: item.formulacion && Array.isArray(data.formulaciones)
                  ? {
                      ...item.formulacion,
                      materias_primas: item.formulacion.materias_primas.map((mp) => {
                        const mpAct = data.formulaciones.find(
                          (f) => String(f.id) === String(mp.id)
                        );
                        if (!mpAct) return mp;
                        const cantidad       = mpAct.cantidad       ?? mp.cantidad;
                        const costo_unitario = mpAct.costo_unitario ?? mp.costo_unitario;
                        return { ...mp, cantidad, costo_unitario, costo_total: cantidad * costo_unitario };
                      }),
                    }
                  : item.formulacion,
              };
            }),
          };
        }
      );

      // ✅ Siempre invalidar después del update optimista para sincronizar con el servidor
      queryClient.invalidateQueries({
        queryKey: inventarioKeys.byBodegaBase(bodegaId),
      });

      toast.success('Item actualizado correctamente');
    },

    onError: (error) => {
      queryClient.invalidateQueries({
        queryKey: inventarioKeys.byBodegaBase(bodegaId),
      });
      toast.error(error?.response?.data?.message || 'Error al actualizar el item');
    },
  });
};