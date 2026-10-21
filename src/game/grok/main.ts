import * as Phaser from 'phaser';
import { enableOfflinePlay } from '../offline';
import { NightArrivalScene, VIEW_H, VIEW_W } from './NightArrivalScene';

// Entry for Grok's take on level 1, served at /play/grok/. Claude's level at
// /play/ is untouched; this page only reuses its offline helper.

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#020814',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: VIEW_W,
    height: VIEW_H,
  },
  scene: new NightArrivalScene(),
});

void enableOfflinePlay();
