import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Output directory
    outDir: 'dist',
    
    // Clean the output directory before build
    emptyOutDir: true,
    
    // Generate source maps for production debugging
    sourcemap: true,
    
    // Minify the output
    minify: 'terser',
    
    // Terser options for better compression
    terserOptions: {
      compress: {
        // Remove console.log in production
        drop_console: true,
        // Remove debugger statements
        drop_debugger: true,
        // Remove unused code
        dead_code: true,
      },
      mangle: {
        // Mangle variable names for smaller size
        toplevel: true,
      },
    },
    
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
    
    // Target modern browsers for smaller bundle size
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
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
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
