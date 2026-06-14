import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // All /api/* requests go through FastAPI Gateway (port 8000)
      // Gateway then forwards to Spring Boot (port 8081)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Node.js backend (port 3001) for search logs & analytics
      '/node': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
