import { enableOffline } from '../../offline/offline';
import { Sound } from '../sound';
import { DefinitionsLevel } from './level';
import { VesselView } from './VesselView';

// Chapter 1 of the arcade game: Rules of the Road. Level 1, Definitions, plays
// upright with one thumb (G8) and also works sideways and with a keyboard.
// `?seed=N` fixes the shuffle, for tests and the verification skill.

const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isSafeInteger(seedParam) && params.has('seed') ? seedParam : Date.now();
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const art = document.getElementById('art');
if (!art) throw new Error('#art is missing from rules/index.html');

new DefinitionsLevel({
  seed,
  sound: new Sound(),
  vessel: new VesselView(art),
  reducedMotion: () => motion.matches,
  now: () => performance.now(),
  home: () => window.location.assign('/'),
});

void enableOffline();
