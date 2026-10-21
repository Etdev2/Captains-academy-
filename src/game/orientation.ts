import type * as Phaser from 'phaser';

// Steering levels play in landscape and rapid-fire levels in portrait with one
// thumb (DECISIONS.md G8). Each scene asks for its own orientation: this sets
// the game's size, and a body class tells play/index.html not to show the
// "turn your phone sideways" prompt over a portrait level.

export const LANDSCAPE = { w: 1280, h: 768 } as const;
export const PORTRAIT = { w: 720, h: 1280 } as const;

export function setOrientation(game: Phaser.Game, orientation: 'landscape' | 'portrait'): void {
  const size = orientation === 'portrait' ? PORTRAIT : LANDSCAPE;
  document.body.classList.toggle('portrait-level', orientation === 'portrait');
  const current = game.scale.gameSize;
  if (current.width !== size.w || current.height !== size.h) game.scale.setGameSize(size.w, size.h);
}
