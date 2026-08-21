import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  envDir: '../',
  plugins: [react()],
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Function form (not object form) so react/react-dom stay in their own
        // chunk once routes are code-split via React.lazy(). The object form
        // leaves vendor-react empty and leaks React into vendor-router.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-router-dom')) return 'vendor-router'
          if (id.includes('lucide-react')) return 'vendor-icons'
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) return 'vendor-react'
          return 'vendor'
        },
      },
    },
  },
  server: {
    port: 5176,
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
