import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_APP_BASE || '/',
  server: {
    proxy: process.env.VITE_API_URL
      ? { '/api': { target: process.env.VITE_API_URL, changeOrigin: true } }
      : {},
  },
})
