import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // All /api/* requests go directly to the Spring Boot backend on 8082.
      // The FastAPI gateway is optional for this dev setup.
      '/api': {
        target: 'http://127.0.0.1:8082',
        changeOrigin: true,
      },
      // Node.js backend (port 3001) for search logs & analytics
      // Use '/node/' to avoid matching '/node_modules/*'.
      '/node/': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
})
