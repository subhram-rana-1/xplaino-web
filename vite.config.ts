import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/features': path.resolve(__dirname, './src/features'),
    },
  },
  server: {
    allowedHosts: [
      'xplaino.com',
      'www.xplaino.com',
      '898b-2401-4900-8fd1-9d0e-adab-d8c5-6300-b9d7.ngrok-free.app',
    ],
  },
  preview: {
    allowedHosts: [
      'xplaino.com',
      'www.xplaino.com',
      '898b-2401-4900-8fd1-9d0e-adab-d8c5-6300-b9d7.ngrok-free.app',
    ],
  },
})



