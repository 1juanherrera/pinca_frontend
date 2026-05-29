import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Configuración de tests con Vitest.
//
// Activación:
//   npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitest/ui
//   npm run test                (watch)
//   npm run test -- --run       (una sola corrida)
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    setupFiles: ['./src/test/setup.js'],
  },
});
