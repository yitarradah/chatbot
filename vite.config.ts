
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode (development, production)
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Priority: env file -> Vercel env variable -> fallback
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || process.env.VITE_API_KEY),
      'process.env.ADMIN_USER': JSON.stringify(env.ADMIN_USER || 'admin'),
      'process.env.ADMIN_PASS': JSON.stringify(env.ADMIN_PASS || 'admin123')
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      minify: 'esbuild'
    },
    server: {
      port: 5173,
      host: true
    }
  };
});
