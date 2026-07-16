import axios from 'axios';
import { toast } from 'react-hot-toast';

// Fallback coherente con empresaInfo/EmpresaTab (mismo backend Nest). En prod,
// VITE_API_BASE_URL se hornea en build; el fallback solo aplica en dev sin .env.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3009/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor para manejar respuestas y errores globales
apiClient.interceptors.response.use(
  (response) => response.data, // Retornamos directamente el body
  (error) => {
    // 401 → sesión inválida/expirada. Redirigir al login silenciosamente
    // sin mostrar mensajes técnicos como "Token no proporcionado".
    if (error.response?.status === 401) {
      import('../store/useBoundStore').then(({ useBoundStore }) => {
        useBoundStore.getState().logout();
      });
      return Promise.reject(error);
    }

    const backendMsg = error.response?.data?.message
      || error.response?.data?.messages?.error
      || error.response?.data?.msg;

    if (backendMsg) {
      toast.dismiss();
      toast.error(backendMsg);
    } else if (!error.response) {
      toast.error('Error de red. Verificá tu conexión.');
    } else if (error.response.status >= 500) {
      toast.error('Error en el servidor');
    }

    return Promise.reject(error);
  }
);

export default apiClient;