import * as Phaser from 'phaser';
import crosswind from '../../missions/long-beach-crosswind.json';
import firstSlip from '../../missions/long-beach-docking.json';
import trafficRun from '../../missions/long-beach-traffic.json';
import { parseMission } from '../sim/mission';
import { compileLevel } from '../sim/sim';
import { HarborScene, VIEW_H, VIEW_W } from './HarborScene';
import { enableOffline } from '../offline/offline';
import { Sound } from './sound';

// Levels in play order. A level opens once the one before it has been docked.
const levels = [firstSlip, crosswind, trafficRun].map((m) => compileLevel(parseMission(m)));

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
  scene: new HarborScene(levels, new Sound()),
});

void enableOffline();
