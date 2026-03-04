import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // 1. Importa las DevTools
import { Toaster } from 'react-hot-toast'; // 2. Agregamos el contenedor de notificaciones
import './index.css';
import App from './App.jsx';

// 3. Configuramos comportamientos globales
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Los datos se consideran "frescos" por 5 minutos
      gcTime: 1000 * 60 * 30,    // Los datos inactivos se borran del caché a los 30 min
      retry: 1,                 // Si falla, solo reintenta una vez
      refetchOnWindowFocus: false, // Evita peticiones extra al cambiar de pestaña (opcional)
    },
  },
});

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    {/* 4. Toaster para que funcionen los toast.error() del apiClient */}
    <Toaster 
      position="bottom-right"
      toastOptions={{
        duration: 4000,
        success: {
          iconTheme: {
            primary: '#15803d',   // green-700
            secondary: '#ffffff', // text-white 
          },
        },
        error: {
          iconTheme: {
            primary: '#b91c1c',   // red-700
            secondary: '#ffffff', // text-white 
          },
        },
      }}
    />
    
    <App />

    {/* 5. Panel de control del caché (solo visible en desarrollo) */}
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
)