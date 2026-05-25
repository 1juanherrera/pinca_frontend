import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';
import ErrorBoundary from './shared/ErrorBoundary.jsx';
import ToastLimiter from './shared/ToastLimiter.jsx';

// Política central de reintentos: NO reintentamos errores del cliente (4xx)
// porque son determinísticos — pegarle 3 veces al mismo 422 no va a cambiar
// nada y solo confunde con toasts duplicados. Sí reintentamos red caída
// (sin response) y 5xx (servidor saturado/transitorio).
const shouldRetry = (failureCount, error) => {
  const status = error?.response?.status;
  if (status && status >= 400 && status < 500) return false; // 4xx → no retry
  return failureCount < 2; // 5xx o sin response → hasta 2 reintentos
};

// 3. Configuramos comportamientos globales
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // Datos "frescos" por 5 minutos
      gcTime: 1000 * 60 * 30,      // Cache inactivo se borra a los 30 min
      retry: shouldRetry,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000), // backoff exponencial cap 8s
      refetchOnWindowFocus: false, // Evita refetch al cambiar de pestaña
    },
    mutations: {
      // Mutaciones NO se reintentan por default: un POST a medio camino podría
      // duplicar un registro. Cada mutación que sea idempotente puede pedir
      // retry explícitamente.
      retry: 0,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={queryClient}>
    <ToastLimiter />
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
    
    <ErrorBoundary>
      <App />
    </ErrorBoundary>

    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
)