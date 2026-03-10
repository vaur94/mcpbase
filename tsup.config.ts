import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    splitting: false,
    target: 'node20',
    outExtension() {
      return {
        js: '.js',
      };
    },
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  {
    entry: ['src/examples/index.ts', 'src/security/index.ts', 'src/hub/index.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    splitting: false,
    target: 'node20',
    outExtension() {
      return {
        js: '.js',
      };
    },
  },
]);
