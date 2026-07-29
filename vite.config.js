import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    allowedHosts: ['host.docker.internal'], // permite que ZAP (Docker) le pegue sin el 403
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router'],
          'vendor-ui':     ['lucide-react'],
          'vendor-charts': ['recharts'],
        },
      },
    },
  },
})