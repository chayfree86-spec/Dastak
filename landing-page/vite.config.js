import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  envDir: '../',
  plugins: [react()],
  build: {
    // Hostinger's Web Hosting plan can't change the primary domain's document
    // root (it's always public_html, which mirrors this repo's root). So the
    // landing page must build directly into the repo root, not landing-page/dist.
    outDir: '../',
    emptyOutDir: false,
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5172,
    host: true,
    headers: {
      // Dev server must never let the browser cache module responses —
      // otherwise a normal refresh can keep showing pre-edit code.
      'Cache-Control': 'no-store',
    },
    watch: {
      usePolling: true,
      interval: 300,
      ignored: ['**/dist/**', '**/.git/**'],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/storage': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
