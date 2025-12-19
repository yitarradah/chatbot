
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  // Fixed: Property 'cwd' does not exist on type 'Process' by casting to any
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.VITE_API_KEY),
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