import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy API requests to the Flask backend
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
      // If you have other Flask routes (like auth) that aren't under /api
      '/login': 'http://127.0.0.1:5000',
      '/logout': 'http://127.0.0.1:5000',
      '/signup_client': 'http://127.0.0.1:5000',
      '/signup_coiffeur': 'http://127.0.0.1:5000',
      '/static': 'http://127.0.0.1:5000'
    }
  },
  build: {
    // Output build files to a directory Flask can serve easily if needed
    outDir: 'dist',
    emptyOutDir: true
  }
})