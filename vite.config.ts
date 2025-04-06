import { defineConfig } from 'vite';
import {nodePolyfills} from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    nodePolyfills({
      // Enable polyfills for Node.js modules like `crypto`
      protocolImports: true,
    }),
  ],
  build: {
    target: 'esnext', // Ensure modern syntax is supported
    rollupOptions: {
      output: {
        format: 'es',
      },
    },
  },
});
