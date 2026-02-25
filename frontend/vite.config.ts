import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force Rebuild for SEO Sitemap Fix
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      define: {
        'process.env': JSON.stringify(env)
      },
      plugins: [react()],
      esbuild: {
        // Strip console.log and console.warn from production builds
        // Keeps console.error for critical error reporting
        drop: mode === 'production' ? ['console', 'debugger'] : [],
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});