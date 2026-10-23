import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({ root: 'studio', base: '/studio/', plugins: [vue()], server: { host: '127.0.0.1', port: 4180, strictPort: true, proxy: { '/api': { target: 'http://127.0.0.1:4181', changeOrigin: true }, '/images': { target: 'http://127.0.0.1:4181', changeOrigin: true } } }, build: { outDir: '../studio-dist', emptyOutDir: true } });
