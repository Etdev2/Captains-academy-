import * as Phaser from 'phaser';
import { enableOffline } from '../../offline/offline';
import { Sound } from '../sound';
import { DefinitionsScene, VIEW_H, VIEW_W } from './DefinitionsScene';

// Chapter 1 of the arcade game: Rules of the Road. Level 1, Definitions, plays
// upright with one thumb (G8), so this page has no rotate prompt.

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#06121f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: VIEW_W,
    height: VIEW_H,
  },
  scene: new DefinitionsScene(new Sound()),
});

void enableOffline();
