import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    proxy: {
      '/auth': 'http://localhost:3001',
      '/thoughts': 'http://localhost:3001',
      '/messages': 'http://localhost:3001',
    },
  },
})
