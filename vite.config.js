import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../backend/src/main/resources/static',
    emptyOutDir: true
  },
  server: {
    proxy: {
      // REST API calls
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      // WebSocket / SockJS endpoint
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true,          // Enable WebSocket proxying
      },
    },
  },
  define: {
    global: 'globalThis', // Required for SockJS in Vite
  },
})