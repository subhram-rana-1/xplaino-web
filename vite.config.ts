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
      'cb6d-106-215-147-51.ngrok-free.app',
    ],
  },
  preview: {
    allowedHosts: [
      'xplaino.com',
      'www.xplaino.com',
      'cb6d-106-215-147-51.ngrok-free.app',
    ],
  },
})



