import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../api/apiClient';
import { API_ROUTES } from '../../../api/apiRoutes';
import toast from 'react-hot-toast';
import { formulacionKeys } from './FormulacionKeys';
import { itemKeys } from '../../Inventario/api/itemKeys';

export const useFormulaciones = (id = null, volumen = null, itemId = null, proveedorId = null) => {
  const queryClient = useQueryClient();

  // 1. Obtener todas las formulaciones
  const queryList = useQuery({
    queryKey: formulacionKeys.lists(),
    queryFn:  () => apiClient.get(API_ROUTES.FORMULACIONES.LIST),
  });

  // 2. Calcular costos base
  const queryCostos = useQuery({
    queryKey: formulacionKeys.costs(id),
    queryFn:  () => apiClient.get(API_ROUTES.FORMULACIONES.COSTOS(id)),
    enabled:  !!id,
    staleTime: 1000 * 60 * 5,
  });

  // 3. Recalcular costos por volumen
  const queryRecalcular = useQuery({
    queryKey: formulacionKeys.recalculate(id, volumen),
    queryFn:  () => apiClient.get(API_ROUTES.FORMULACIONES.RECALCULAR(id, volumen)),
    enabled:  !!id && !!volumen,
    // Mantener los datos previos SOLO si sigue siendo el mismo producto
    // (evita el parpadeo al cambiar el volumen). Si cambia el producto, NO
    // conservar el placeholder: de lo contrario la tabla seguiría mostrando la
    // fórmula del producto anterior (dataToShow = recalculatedData || productDetail).
    // La key de recalculate es ['formulaciones','recalculate', id, volumen] → id en índice 2.
    placeholderData: (previousData, previousQuery) => {
      const prevId = previousQuery?.queryKey?.[2];
      return String(prevId) === String(id) ? previousData : undefined;
    },
  });

  // Proveedores disponibles para la formulación del producto seleccionado
  const queryProveedores = useQuery({
    queryKey: formulacionKeys.proveedores(id),
    queryFn:  () => apiClient.get(API_ROUTES.FORMULACIONES.PROVEEDORES(id)),
    enabled:  !!id,
    staleTime: 1000 * 60 * 5,
  });

  // Costos recalculados por proveedor
  const queryCostosProveedor = useQuery({
    queryKey: formulacionKeys.costsByProveedor(id, proveedorId),
    queryFn:  () => apiClient.get(API_ROUTES.FORMULACIONES.COSTOS_PROVEEDOR(id, proveedorId)),
    enabled:  !!id && !!proveedorId,
    staleTime: 1000 * 60 * 5,
  });

  // Opciones de proveedor por ingrediente
  const queryOpcionesIngredientes = useQuery({
    queryKey: formulacionKeys.opcionesIngredientes(id),
    queryFn:  () => apiClient.get(API_ROUTES.FORMULACIONES.OPCIONES_INGREDIENTES(id)),
    enabled:  !!id,
    staleTime: 1000 * 60 * 5,
  });

  // ✅ 4. Formulación de un item específico (para el modal)
  const queryByItem = useQuery({
    queryKey: formulacionKeys.byItem(itemId),
    queryFn:  () => apiClient.get(API_ROUTES.FORMULACIONES.BY_ITEM(itemId)),
    enabled:  !!itemId,
  });

  // ✅ CREATE
  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post(API_ROUTES.FORMULACIONES.CREATE, data),
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
    mutationFn: (data) => apiClient.post(API_ROUTES.ITEMS.GENERAL, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: itemKeys.materiasPrimas() });
      toast.success('Ítem creado correctamente');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Error al crear el ítem'),
  });

  // ✅ UPDATE
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.put(API_ROUTES.FORMULACIONES.UPDATE(id), data),
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
    queryFn:  () => apiClient.get(API_ROUTES.ITEMS.LEGACY_ALL),
  });

  // ✅ Materias disponibles: item_general tipo=1 + item_proveedor no vinculados
  const queryMateriasDisponibles = useQuery({
    queryKey: [...itemKeys.all, 'materias-disponibles'],
    queryFn:  () => apiClient.get(API_ROUTES.ITEMS.MATERIAS_DISPONIBLES),
  });

  // ✅ Productos (tipo = 0)
  const queryProductos = useQuery({
    queryKey: itemKeys.lists(),
    queryFn:  () => apiClient.get(API_ROUTES.ITEMS.GENERAL),
  });

  // ✅ Clonar fórmula a otro producto
  const clonarMutation = useMutation({
    mutationFn: ({ from_item_id, to_item_id, nombre }) =>
      apiClient.post(API_ROUTES.FORMULACIONES.CLONAR, { from_item_id, to_item_id, nombre }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: formulacionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: formulacionKeys.byItem(String(variables.to_item_id)) });
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      toast.success('Fórmula clonada correctamente');
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Error al clonar la fórmula'),
  });

  // ✅ Vincular item_proveedor → item_general (auto-crea si es necesario)
  const vincularMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.patch(API_ROUTES.ITEM_PROVEEDORES.VINCULAR(id), data),
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

    // Opciones de proveedor por ingrediente
    opcionesIngredientes:         queryOpcionesIngredientes.data ?? null,
    isLoadingOpcionesIngredientes: queryOpcionesIngredientes.isLoading,

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

    // ✅ Clonar fórmula
    clonarFormulacionAsync: clonarMutation.mutateAsync,
    isCloning:              clonarMutation.isPending,

    isSaving: createMutation.isPending || updateMutation.isPending,
  };
};