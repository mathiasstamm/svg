import { defineConfig } from 'vite';

export default defineConfig({
  base: '/svg',
  build: {
    target: 'esnext', // Ensure modern syntax is supported
    rollupOptions: {
      output: {
        format: 'es',
      },
    },
  },
});
