import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { OutputBundle } from 'rollup';

const MAX_CHUNK_BYTES = 500 * 1024;

function chunkBudgetPlugin(): Plugin {
  return {
    name: 'chunk-budget',
    generateBundle(_options, bundle: OutputBundle) {
      for (const output of Object.values(bundle)) {
        if (output.type === 'chunk' && output.code.length > MAX_CHUNK_BYTES) {
          throw new Error(
            `Chunk ${output.fileName} exceeds the 500 kB budget (${output.code.length} bytes)`
          );
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), chunkBudgetPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/react/') || id.includes('/react-dom/')) {
            return 'react-vendor';
          }
          if (id.includes('/i18next/') || id.includes('/react-i18next/')) {
            return 'i18n-vendor';
          }
          if (id.includes('/@dnd-kit/') || id.includes('/@tanstack/')) {
            return 'interaction-vendor';
          }
          if (id.includes('/crypto-js/') || id.includes('/zod/')) {
            return 'data-vendor';
          }
          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 5174,
    proxy: {
      // 开发环境下，将 /api 转发到本机 new-api，避免 CORS 问题
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
