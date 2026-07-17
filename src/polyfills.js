// ── Polyfills de Node para @react-pdf/renderer en el navegador ──────────────
// react-pdf / pdfkit usan globales de Node (Buffer/global/process) que NO existen
// en el browser → sin esto la vista previa/descarga de PDF tira "Buffer is not
// defined" (react-pdf lo necesita al cargar el logo de la empresa).
//
// `buffer` es un paquete standalone (npm), sin acople a la versión de Vite.
// Este módulo se importa PRIMERO en main.jsx: al evaluarse los imports en orden,
// sus efectos corren antes que cualquier otro módulo (incluido react-pdf lazy).
import { Buffer } from 'buffer';

globalThis.Buffer = globalThis.Buffer ?? Buffer;
globalThis.global = globalThis.global ?? globalThis;

if (!globalThis.process) {
  globalThis.process = {
    env: {},
    browser: true,
    version: '',
    nextTick: (cb, ...args) => queueMicrotask(() => cb(...args)),
  };
}
