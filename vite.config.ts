import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@screens': resolve(__dirname, 'src/screens'),
      '@state': resolve(__dirname, 'src/state'),
      '@theme': resolve(__dirname, 'src/theme'),
      '@sdk': resolve(__dirname, 'src/sdk'),
      '@router': resolve(__dirname, 'src/router'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8787', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8787', ws: true, changeOrigin: true },
    },
  },
})
