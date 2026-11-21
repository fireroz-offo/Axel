import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' => works on GitHub Pages under any repo name, and when opened from any static host.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
  worker: { format: 'es' }
});
