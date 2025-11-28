import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // or use '0.0.0.0'
    port: 5173
  },
  optimizeDeps: {
    exclude: ['lucide-react', 'mongoose', 'bcryptjs', 'jsonwebtoken'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate large dependencies into chunks
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['framer-motion', 'lucide-react'],
          utils: ['zustand', 'axios', 'date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 600, // Slightly increase limit
  },
});
