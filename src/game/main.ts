import * as Phaser from 'phaser';
import missionJson from '../../missions/long-beach-docking.json';
import { parseMission } from '../sim/mission';
import { compileLevel } from '../sim/sim';
import { HarborScene, VIEW_H, VIEW_W } from './HarborScene';
import { enableOfflinePlay } from './offline';

const level = compileLevel(parseMission(missionJson));

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
  scene: new HarborScene(level),
});

void enableOfflinePlay();
