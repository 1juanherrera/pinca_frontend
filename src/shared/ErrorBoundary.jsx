import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Error no capturado:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-subtle">
          <div className="bg-white rounded-2xl shadow p-10 max-w-md text-center">
            <h1 className="text-2xl font-bold text-content-primary mb-2">Algo salió mal</h1>
            <p className="text-content-tertiary mb-6">
              Ocurrió un error inesperado. Recarga la página o contacta al administrador.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-content-primary text-white rounded-lg hover:bg-content-secondary transition"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
