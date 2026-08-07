import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 10000,
    host: '0.0.0.0',
    allowedHosts: true
  },
  server: {
    host: '0.0.0.0'
  }
})
