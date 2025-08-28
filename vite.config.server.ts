import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    ssr: true,
    target: 'node18',
    rollupOptions: {
      input: path.resolve(__dirname, 'server/index.ts'),
      output: {
        format: 'es',
      },
      external: [
        'express',
        'vite',
        'drizzle-orm',
        '@neondatabase/serverless',
        'pg',
        'ws',
        'nanoid',
        'zod',
        'path',
        'fs',
        'crypto',
        'http',
        'url',
        'stream',
        'util',
        'events',
        'buffer',
        'querystring',
        'os',
        'child_process'
      ]
    }
  },
  esbuild: {
    target: 'node18'
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "./shared"),
    }
  }
});