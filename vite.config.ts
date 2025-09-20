import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  root: './src',
  publicDir: '../resources',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './src/index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})