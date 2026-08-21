import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  envDir: '../',
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Function form (not the plain-object form) so it stays correct once
        // routes are code-split via React.lazy() — object form can leave
        // react/react-dom out of their intended chunk in that setup.
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
    port: 5191,
    strictPort: true,
    headers: {
      // Dev server must never let the browser cache module responses —
      // otherwise a normal refresh can keep showing pre-edit code.
      'Cache-Control': 'no-store',
    },
    watch: {
      usePolling: true,
      interval: 300,
      ignored: [
        '**/customer-app/**',
        '**/partner-app/**',
        '**/deliveryboy-app/**',
        '**/backend/**',
        '**/api/**',
        '**/dist/**',
      ],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
