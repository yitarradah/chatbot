
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Use a type assertion for process to access cwd(), resolving the error in environments with restricted process types.
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
      'process.env.ADMIN_USER': JSON.stringify(env.ADMIN_USER || process.env.ADMIN_USER),
      'process.env.ADMIN_PASS': JSON.stringify(env.ADMIN_PASS || process.env.ADMIN_PASS)
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      minify: 'esbuild'
    }
  };
});
