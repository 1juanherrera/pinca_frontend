import { useNavigate } from 'react-router';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-subtle">
      <div className="bg-white rounded-2xl shadow p-10 max-w-md text-center">
        <p className="text-6xl font-bold text-content-muted mb-4">404</p>
        <h1 className="text-xl font-bold text-content-primary mb-2">Página no encontrada</h1>
        <p className="text-content-tertiary mb-6">La ruta que buscas no existe.</p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="px-5 py-2 bg-content-primary text-white rounded-lg hover:bg-content-secondary transition"
        >
          Ir al inicio
        </button>
      </div>
    </div>
  );
};

export default NotFound;
