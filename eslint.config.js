import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

// Import boundaries from ADR 0001. scripts/verify.sh checks that each one is
// named here: src/sim may not import phaser, DOM globals or src/platform;
// @revenuecat packages are allowed only in src/platform; and src/sim may not
// use Math.random, Date, performance.now or requestAnimationFrame.
//
// Game time is never sea time (DECISIONS.md A3, G19), so the sea-time log in
// src/log and the game in src/game and src/sim never import each other.

const domGlobals = Object.keys(globals.browser).filter((name) => !(name in globals.es2021));

const revenuecatOnlyInPlatform = {
  group: ['@revenuecat/*'],
  message: '@revenuecat packages belong in src/platform only.',
};
// ADR 0009: React, Tailwind and shadcn/ui are for app screens. The arcade game stays as built.
const noReactInGame = {
  group: [
    'react',
    'react/*',
    'react-dom',
    'react-dom/*',
    'radix-ui',
    'lucide-react',
    '@/*',
    '**/components/*',
  ],
  message: 'ADR 0009: the game never imports React, shadcn components or app-screen code.',
};
const noSeaLog = {
  group: ['**/log', '**/log/*'],
  message: 'Game time is never sea time: the game never imports the sea-time log.',
};

export default tseslint.config(
  {
    ignores: [
      'dist/',
      'node_modules/',
      '.claude/',
      '.codex/',
      'playwright-report/',
      'test-results/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.es2021 } },
  },
  {
    files: [
      'src/game/**',
      'src/home/**',
      'src/platform/**',
      'src/log/**',
      'src/store/**',
      'src/offline/**',
      'src/prototypes/**',
      'src/components/**',
      'src/lib/**',
      'e2e/**',
    ],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['public/sw.js'],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
  {
    files: ['scripts/**', 'tests/**', '*.config.*', 'e2e/**'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    // @revenuecat/* lives behind the Entitlements interface in src/platform only.
    files: ['**/*.{ts,js}'],
    ignores: ['src/platform/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [revenuecatOnlyInPlatform] }],
    },
  },
  {
    // The rule above applies here too; a later block replaces its options, so it is repeated.
    files: ['src/game/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [revenuecatOnlyInPlatform, noSeaLog, noReactInGame] },
      ],
    },
  },
  {
    files: ['src/prototypes/**/*.tsx', 'src/components/**/*.tsx'],
    ...reactHooks.configs.flat['recommended-latest'],
  },
  {
    files: ['src/log/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            revenuecatOnlyInPlatform,
            {
              group: ['**/game', '**/game/*', '**/sim', '**/sim/*', 'phaser', 'phaser/*'],
              message: 'Game time is never sea time: the sea-time log never imports the game.',
            },
          ],
        },
      ],
    },
  },
  {
    // src/sim is pure, deterministic TypeScript: data in, data out.
    files: ['src/sim/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['phaser', 'phaser/*'], message: 'src/sim never imports phaser.' },
            {
              group: ['**/platform', '**/platform/*', 'src/platform/*'],
              message: 'src/sim never imports src/platform.',
            },
            { group: ['**/game', '**/game/*'], message: 'src/sim never imports the renderer.' },
            revenuecatOnlyInPlatform,
            noSeaLog,
            noReactInGame,
            { group: ['node:*'], message: 'src/sim runs in the browser and in tests alike.' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        ...domGlobals.map((name) => ({ name, message: 'src/sim may not touch DOM globals.' })),
        { name: 'Date', message: 'Date is banned in src/sim: time comes from the frame number.' },
        { name: 'performance', message: 'performance.now is banned in src/sim.' },
        { name: 'requestAnimationFrame', message: 'requestAnimationFrame is banned in src/sim.' },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Math.random is banned in src/sim. Use a seeded generator.',
        },
        {
          object: 'performance',
          property: 'now',
          message: 'performance.now is banned in src/sim.',
        },
        {
          object: 'Math',
          property: 'sin',
          message: 'Use isin from src/sim/trig: transcendental functions differ by engine.',
        },
        {
          object: 'Math',
          property: 'cos',
          message: 'Use icos from src/sim/trig: transcendental functions differ by engine.',
        },
        {
          object: 'Math',
          property: 'atan2',
          message: 'Transcendental functions differ by engine.',
        },
      ],
    },
  },
);
