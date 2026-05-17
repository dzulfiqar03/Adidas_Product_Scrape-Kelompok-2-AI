import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  root: 'Public', // <--- Beritahu Vite untuk mencari index.html di sini
  build: {
    outDir: '../dist',
    emptyOutDir: true, // Untuk menghilangkan warning kuning di terminalmu
    rollupOptions: {
      input: {
        // Daftarkan semua halaman HTML kamu di sini sebagai entry point
        main: resolve(__dirname, 'Public/index.html'),
        product: resolve(__dirname, 'Public/Src/views/Product.html'),
        welcome: resolve(__dirname, 'Public/Src/views/WelcomePage.html')
      }
    }
  }
})