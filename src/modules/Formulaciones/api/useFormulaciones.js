import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import toast from 'react-hot-toast';
import { formulacionKeys } from './FormulacionKeys';
import { itemKeys } from '../../Inventario/api/itemKeys';

export const useFormulaciones = (id = null, volumen = null, itemId = null, proveedorId = null) => {
  const queryClient = useQueryClient();

  // 1. Obtener todas las formulaciones
  const queryList = useQuery({
    queryKey: formulacionKeys.lists(),
    queryFn:  () => apiClient.get('/formulaciones'),
  });

  // 2. Calcular costos base
  const queryCostos = useQuery({
    queryKey: formulacionKeys.costs(id),
    queryFn:  () => apiClient.get(`/formulaciones/costos/${id}`),
    enabled:  !!id,
    staleTime: 1000 * 60 * 5,
  });

  // 3. Recalcular costos por volumen
  const queryRecalcular = useQuery({
    queryKey: formulacionKeys.recalculate(id, volumen),
    queryFn:  () => apiClient.get(`/formulaciones/recalcular_costos/${id}/${volumen}`),
    enabled:  !!id && !!volumen,
    placeholderData: (previousData) => previousData,
  });

  // Proveedores disponibles para la formulación del producto seleccionado
  const queryProveedores = useQuery({
    queryKey: formulacionKeys.proveedores(id),
    queryFn:  () => apiClient.get(`/formulaciones/${id}/proveedores`),
    enabled:  !!id,
    staleTime: 1000 * 60 * 5,
  });

  // Costos recalculados por proveedor
  const queryCostosProveedor = useQuery({
    queryKey: formulacionKeys.costsByProveedor(id, proveedorId),
    queryFn:  () => apiClient.get(`/formulaciones/costos/${id}/proveedor/${proveedorId}`),
    enabled:  !!id && !!proveedorId,
    staleTime: 1000 * 60 * 5,
  });

  // ✅ 4. Formulación de un item específico (para el modal)
  const queryByItem = useQuery({
    queryKey: formulacionKeys.byItem(itemId),
    queryFn:  () => apiClient.get(`/formulacion_item/${itemId}`),
    enabled:  !!itemId,
  });

  // ✅ CREATE
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/formulaciones', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formulacionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formulacionKeys.byItem(variables.item_general_id?.toString()) });
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      toast.success('Formulación creada correctamente');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Error al crear la formulación'),
  });

  // ✅ QUICK CREATE ITEM (producto o materia prima desde el modal)
  const createItemMutation = useMutation({
    mutationFn: (data) => apiClient.post('/item_general', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: itemKeys.materiasPrimas() });
      toast.success('Ítem creado correctamente');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Error al crear el ítem'),
  });

  // ✅ UPDATE
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(`/formulaciones/${id}`, data),
    onSuccess: (_) => {
      queryClient.invalidateQueries({ queryKey: formulacionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formulacionKeys.byItem(itemId?.toString()) });
      queryClient.invalidateQueries({ queryKey: formulacionKeys.costs(id) });
      toast.success('Formulación actualizada correctamente');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Error al actualizar la formulación'),
  });

  // ✅ Materias primas (tipo = 1) — usado por otras partes del sistema
  const queryMateriasPrimas = useQuery({
    queryKey: itemKeys.materiasPrimas(),
    queryFn:  () => apiClient.get('/items'),
  });

  // ✅ Materias disponibles: item_general tipo=1 + item_proveedor no vinculados
  const queryMateriasDisponibles = useQuery({
    queryKey: [...itemKeys.all, 'materias-disponibles'],
    queryFn:  () => apiClient.get('/items/materias_disponibles'),
  });

  // ✅ Productos (tipo = 0)
  const queryProductos = useQuery({
    queryKey: itemKeys.lists(),
    queryFn:  () => apiClient.get('/item_general'),
  });

  // ✅ Vincular item_proveedor → item_general (auto-crea si es necesario)
  const vincularMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.patch(`/item_proveedores/${id}/vincular`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.materiasPrimas() });
      queryClient.invalidateQueries({ queryKey: [...itemKeys.all, 'materias-disponibles'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Error al registrar la materia prima'),
  });

  return {
    // Data existente
    formulaciones:      queryList.data ?? [],
    costosBase:         queryCostos.data ?? null,
    costosRecalculados: queryRecalcular.data ?? null,

    // Proveedores y costos por proveedor
    proveedoresFormulacion:    queryProveedores.data ?? [],
    isLoadingProveedores:      queryProveedores.isLoading,
    costosProveedor:           queryCostosProveedor.data ?? null,
    isLoadingCostosProveedor:  queryCostosProveedor.isFetching,

    // ✅ Data nueva
    formulacion:             queryByItem.data?.data ?? null,
    isLoadingFormulacion:    queryByItem.isLoading,
    productos:               (queryProductos.data ?? []).filter(p => String(p.tipo) === '0'),
    isLoadingProductos:      queryProductos.isLoading,
    materiasPrimas:          (queryMateriasPrimas.data ?? []).filter(m => String(m.tipo) === '1'),
    isLoadingMateriasPrimas: queryMateriasPrimas.isLoading,
    materiasDisponibles:     queryMateriasDisponibles.data ?? [],

    // States existentes
    isLoading:       queryList.isLoading,
    isCalculating:   queryCostos.isLoading,
    isRecalculating: queryRecalcular.isFetching,
    error:           queryList.error || queryCostos.error || queryRecalcular.error,

    // ✅ Quick item creation
    createItemAsync:  createItemMutation.mutateAsync,
    isCreatingItem:   createItemMutation.isPending,

    // ✅ Vincular item_proveedor → item_general
    vincularItemProveedorAsync: vincularMutation.mutateAsync,
    isVinculando:               vincularMutation.isPending,

    // ✅ Mutations
    createFormulacionAsync: createMutation.mutateAsync,
    createFormulacion:      createMutation.mutate,
    isCreating:             createMutation.isPending,

    updateFormulacionAsync: updateMutation.mutateAsync,
    updateFormulacion:      updateMutation.mutate,
    isUpdating:             updateMutation.isPending,

    isSaving: createMutation.isPending || updateMutation.isPending,
  };
};