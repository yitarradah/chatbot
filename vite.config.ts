
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // This shims process.env for the browser so your geminiService.ts 
    // can access process.env.API_KEY correctly on Vercel
    'process.env': process.env
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild'
  }
});
