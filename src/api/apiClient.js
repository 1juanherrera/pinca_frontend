import axios from 'axios';
import { toast } from 'react-hot-toast';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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
    const backendMsg = error.response?.data?.message
      || error.response?.data?.messages?.error
      || error.response?.data?.msg;

    if (backendMsg) {
      // Diferimos para que aparezca DESPUÉS de cualquier toast genérico
      // que dispare el onError del hook (toast-limiter mantiene el último).
      setTimeout(() => toast.error(backendMsg), 50);
    } else if (!error.response) {
      toast.error('Error de red. Verificá tu conexión.');
    } else if (error.response.status >= 500) {
      toast.error('Error en el servidor');
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;