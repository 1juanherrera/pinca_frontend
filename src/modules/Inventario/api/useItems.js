// src/features/items/api/useItems.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import * as itemService from '../services/itemService';
import { itemKeys } from './itemKeys';

export const useItems = (id = null) => {
  const queryClient = useQueryClient();

  // Query: Obtener lista
  const listQuery = useQuery({
    queryKey: itemKeys.lists(),
    queryFn: itemService.getItems,
  });

  // Query: Obtener detalle (solo si hay ID)
  const detailQuery = useQuery({
    // Si no hay id, usamos la llave de detalles general para no romper el código
    queryKey: id ? itemKeys.detail(id) : itemKeys.details(),
    queryFn: () => itemService.getItem(id),
    enabled: !!id,
  });

  // Lógica de negocio: Filtrar materia prima (tipo 1)
  const materiaPrima = useMemo(() => {
    return listQuery.data?.filter(item => item.tipo === '1') ?? [];
  }, [listQuery.data]);

  // Mutación: Crear
  const createMutation = useMutation({
    mutationFn: itemService.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });

  // Mutación: Actualizar
  const updateMutation = useMutation({
    mutationFn: itemService.updateItem,
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: itemKeys.detail(variables.id) });
    },
  });

  // Mutación: Eliminar
  const deleteMutation = useMutation({
    mutationFn: itemService.deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });

  return {
    // Datos y estados
    items: listQuery.data ?? [],
    materiaPrima,
    isLoading: listQuery.isLoading,
    
    itemDetail: detailQuery.data,
    isLoadingDetail: detailQuery.isLoading,

    // Acciones
    createItem: createMutation.mutate,
    isCreating: createMutation.isPending,
    
    updateItem: updateMutation.mutate,
    isUpdating: updateMutation.isPending,

    removeItem: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};