import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Base path is set to './' so the built site works under any subpath,
// including GitHub Pages (https://<user>.github.io/coin2026/).
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
  server: {
    port: 5173,
    open: false,
  },
});
