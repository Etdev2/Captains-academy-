import { defineConfig } from 'vitest/config';

// The front page at / links to the arcade game at /play (DECISIONS.md G1), its
// Rules of the Road chapter at /rules, and the sea-time log at /log (A3). Vitest shares this file.
export default defineConfig({
  build: {
    // Phaser alone is about 1.2 MB minified; split it out once there is more than one level.
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        home: 'index.html',
        play: 'play/index.html',
        rules: 'rules/index.html',
        log: 'log/index.html',
      },
    },
  },
  preview: { port: 4173, strictPort: true },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
