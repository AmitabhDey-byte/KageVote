import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';

const midnightArtifacts = [
  resolve(__dirname, 'managed'),
  resolve(__dirname, 'managed/kage-vote'),
];

function midnightZkAssets() {
  return {
    name: 'midnight-zk-assets',
    configureServer(server: any) {
      server.middlewares.use((request: { url?: string }, response: { setHeader: (name: string, value: string) => void; end: (data: Buffer) => void }, next: () => void) => {
        const match = (request.url ?? '').match(/^\/(keys|zkir)\/([^?#]+)$/);
        if (!match) return next();
        const [, directory, filename] = match;
        for (const artifactDirectory of midnightArtifacts) {
          try {
            response.setHeader('Content-Type', 'application/octet-stream');
            response.end(readFileSync(resolve(artifactDirectory, directory, filename)));
            return;
          } catch {
            // Check the next compiled contract directory.
          }
        }
        next();
      });
    },
    generateBundle(this: any) {
      for (const directory of ['keys', 'zkir']) {
        for (const artifactDirectory of midnightArtifacts) {
          for (const filename of readdirSync(resolve(artifactDirectory, directory))) {
            this.emitFile({
              type: 'asset',
              fileName: `${directory}/${filename}`,
              source: readFileSync(resolve(artifactDirectory, directory, filename)),
            });
          }
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: mode === 'test'
    ? [react()]
    : [
      react(),
      nodePolyfills(),
      wasm(),
      topLevelAwait({ promiseExportName: '__tla', promiseImportName: (index) => `__tla_${index}` }),
      midnightZkAssets(),
    ],
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
  build: { target: 'esnext' },
  optimizeDeps: {
    include: ['@midnight-ntwrk/compact-runtime'],
    exclude: ['@midnight-ntwrk/onchain-runtime-v3', '@midnight-ntwrk/ledger-v8'],
  },
}));
