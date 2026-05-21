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

    // Limpiar cualquier toast genérico que un hook hubiera disparado antes
    // (onError genérico). Garantiza que el mensaje del backend siempre gane,
    // sin depender de timing/setTimeout.
    if (backendMsg) {
      toast.dismiss();
      toast.error(backendMsg);
    } else if (!error.response) {
      toast.error('Error de red. Verificá tu conexión.');
    } else if (error.response.status >= 500) {
      toast.error('Error en el servidor');
    }

    if (error.response?.status === 401) {
      // Limpiar el store y dejar que Layout redirija via React Router.
      // Antes hacíamos window.location.href = '/login' (hard reload), que
      // causaba flash del panel principal antes del redirect.
      // Import dinámico para evitar dependencia circular con el store.
      import('../store/useBoundStore').then(({ useBoundStore }) => {
        useBoundStore.getState().logout();
      });
    }
    return Promise.reject(error);
  }
);

export default apiClient;