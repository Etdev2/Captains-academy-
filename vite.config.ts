import { defineConfig } from 'vitest/config';

// The arcade game lives at /play (DECISIONS.md G1). Vitest shares this file.
export default defineConfig({
  build: {
    // Phaser alone is about 1.2 MB minified; split it out once there is more than one level.
    chunkSizeWarningLimit: 2000,
    rollupOptions: { input: { play: 'play/index.html', grok: 'play/grok/index.html' } },
  },
  preview: { port: 4173, strictPort: true },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
