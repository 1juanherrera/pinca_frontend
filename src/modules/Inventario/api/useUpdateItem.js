import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { inventarioKeys } from './inventarioKeys';
import toast from 'react-hot-toast';

export const useUpdateItem = (id_bodega) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/bodegas/item/${id}`, data),

    onSuccess: (_response, { id, data }) => {
        const antesKeys = queryClient.getQueriesData({ queryKey: ['inventario'] });
        console.log('Keys en cache:', antesKeys.map(([k]) => JSON.stringify(k)));
        console.log('byBodegaBase que uso:', JSON.stringify(inventarioKeys.byBodegaBase(String(id_bodega))));

      // Actualizar cache directamente sin refetch
      queryClient.setQueriesData(
        { queryKey: inventarioKeys.byBodegaBase(id_bodega) },
        (old) => {
          if (!old?.inventario) return old;

          return {
            ...old,
            inventario: old.inventario.map((item) => {
              if (String(item.id_item_general) !== String(id)) return item;


    console.log('✅ old.inventario encontrado, buscando id:', id, typeof id);
    console.log('ids en cache:', old.inventario.map(i => `${i.id_item_general}(${typeof i.id_item_general})`));
                console.log('id RAW:', JSON.stringify(id), '| primer id cache RAW:', JSON.stringify(old.inventario[0].id_item_general));

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
                        return {
                          ...mp,
                          cantidad,
                          costo_unitario,
                          costo_total: cantidad * costo_unitario,
                        };
                      }),
                    }
                  : item.formulacion,
              };
            }),
          };
        }
      );
      toast.success('Item actualizado correctamente');
    },

    onError: (error) => {
      queryClient.invalidateQueries({
        queryKey: inventarioKeys.byBodegaBase(id_bodega),
      });
      toast.error(error?.response?.data?.message || 'Error al actualizar el item');
    },
  });
};