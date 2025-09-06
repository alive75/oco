import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    // Output directory
    outDir: 'dist',
    
    // Clean the output directory before build
    emptyOutDir: true,
    
    // Generate source maps for production debugging
    sourcemap: true,
    
    // Minify the output (using esbuild instead of terser for better performance)
    minify: 'esbuild',
    
    // Rollup options for chunking
    rollupOptions: {
      output: {
        // Manual chunking for better caching
        manualChunks: {
          // React and related libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // State management
          'vendor-state': ['zustand'],
          // HTTP client
          'vendor-http': ['axios'],
          // UI utilities
          'vendor-ui': ['lucide-react', 'clsx'],
          // Date utilities (if any)
          'vendor-utils': ['date-fns'],
        },
        // Add hash to filenames for cache busting
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
    
    // Chunk size warning limit (500kb)
    chunkSizeWarningLimit: 500,
    
    // Target modern browsers for smaller bundle size (Vite 7 default baseline)
    target: 'baseline-widely-available', // Chrome 107+, Edge 107+, Firefox 104+, Safari 16.0+
  },
  
  // Optimization for development
  server: {
    port: 5173,
    open: true,
    cors: true,
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
  },
  
  // Define global constants  
  define: {
    __APP_VERSION__: '"1.0.0"',
  },
})
