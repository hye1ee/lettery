import { defineConfig } from 'vite';
import { resolve } from 'path';
import type { Plugin } from 'vite';

// Custom plugin to handle /download route in dev mode
const downloadRoutePlugin = (): Plugin => ({
  name: 'download-route',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.startsWith('/download')) {
        // Rewrite URL to serve download.html
        const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
        req.url = '/download.html' + queryString;
      }
      next();
    });
  },
});

export default defineConfig({
  plugins: [downloadRoutePlugin()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        download: resolve(__dirname, 'public/download.html'),
      },
    },
  },
});

