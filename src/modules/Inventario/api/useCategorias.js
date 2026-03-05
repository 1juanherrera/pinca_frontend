import { useQuery } from "@tanstack/react-query";
import apiClient from "../../../api/apiClient";
import { categoriaKeys } from "./categoriaKeys";

export const useCategorias = () => {
  return useQuery({
    queryKey: categoriaKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.get('/categorias');
      // Manejo de data flexible (soporta axios puro o interceptores)
      const data = response?.data !== undefined ? response.data : response;
      return data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hora de caché (las categorías son estables)
    refetchOnWindowFocus: false, // No recargar cada vez que el usuario cambia de pestaña
  });
};