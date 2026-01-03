import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 901,
    proxy: {
      '/api': {
        target: 'http://localhost:900',
        changeOrigin: true
      }
    }
  }
})
