import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// The front page at / links to the arcade game at /play (DECISIONS.md G1), its
// Rules of the Road chapter at /rules, the sea-time log at /log (A3) and the
// internal prototype review board at /prototypes (issue #72). Vitest shares this file.
// React and Tailwind serve app screens only (ADR 0009); the game pages never load them.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    // Phaser alone is about 1.2 MB minified; split it out once there is more than one level.
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        home: 'index.html',
        play: 'play/index.html',
        rules: 'rules/index.html',
        log: 'log/index.html',
        prototypes: 'prototypes/index.html',
      },
    },
  },
  preview: { port: 4173, strictPort: true },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
