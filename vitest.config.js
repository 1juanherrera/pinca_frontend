import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Configuración de tests con Vitest.
//
// IMPORTANTE: Vitest aún NO está instalado (no se instaló por no tener red
// garantizada en el entorno). Para activar los tests, instalar las dev deps:
//
//   npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
//
// Luego:  npm run test          (watch)
//         npm run test -- --run (una sola corrida)
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
});
