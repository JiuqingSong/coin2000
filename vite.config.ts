import { defineConfig } from 'vite';

// Base path is set to './' so the built site works under any subpath,
// including GitHub Pages (https://<user>.github.io/coin2026/).
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
  server: {
    port: 5173,
    open: false,
  },
});
