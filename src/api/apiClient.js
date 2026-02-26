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
    const message = error.response?.data?.message || 'Error en el servidor';
    toast.error(message); // Notificación automática al usuario
    
    if (error.response?.status === 401) {
      // Lógica de logout si el token expira
      localStorage.removeItem('token');
      window.location.href = '/login'; // Redirigir al login
    }
    return Promise.reject(error);
  }
);

export default apiClient;