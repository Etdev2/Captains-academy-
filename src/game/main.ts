import * as Phaser from 'phaser';
import lightsRapidFire from '../../missions/chapter-1-lights-rapid-fire.json';
import crosswind from '../../missions/long-beach-crosswind.json';
import firstSlip from '../../missions/long-beach-docking.json';
import { compileLightsLevel } from '../sim/lights';
import { parseLightsMission } from '../sim/lights-mission';
import { parseMission } from '../sim/mission';
import { compileLevel } from '../sim/sim';
import { HarborScene } from './HarborScene';
import { LightsScene } from './LightsScene';
import { LANDSCAPE, PORTRAIT } from './orientation';
import { enableOfflinePlay } from './offline';
import { Sound } from './sound';

// Chapter 1 in play order. The docking levels open one after another, and the
// lights rapid-fire level opens once the first docking level has a star (G12).
const levels = [firstSlip, crosswind].map((m) => compileLevel(parseMission(m)));
const lights = compileLightsLevel(parseLightsMission(lightsRapidFire));

const audio = new Sound();
const harbor = new HarborScene(levels, audio, {
  id: lights.mission.id,
  unlockedBy: lights.mission.unlockedBy,
});
const lightsScene = new LightsScene(lights, audio);

// /play/?level=lights opens the lights level straight away when it is unlocked.
// Locked, it falls back to the harbor.
const startInLights = new URLSearchParams(window.location.search).get('level') === 'lights';
const size = startInLights ? PORTRAIT : LANDSCAPE;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#06121f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: size.w,
    height: size.h,
  },
  // The first scene listed starts first.
  scene: startInLights ? [lightsScene, harbor] : [harbor, lightsScene],
});

void enableOfflinePlay();
