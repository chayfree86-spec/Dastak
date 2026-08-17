import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    watch: {
      usePolling: true,
      interval: 1000,
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
