import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    // Simplified build - no manual chunks to avoid complexity
    rollupOptions: {
      output: {
        // Let Vite handle chunking automatically
        manualChunks: undefined
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
})

