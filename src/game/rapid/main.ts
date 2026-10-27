import {
  RAPID_LEVELS,
  isUnlocked,
  levelBySlug,
  levelPath,
  levelTitle,
  nextLevel,
  type LevelEntry,
} from '../../sim/chapter1/registry';
import { enableOffline } from '../../offline/offline';
import { Sound } from '../sound';
import { loadStars } from '../storage';
import { RapidLevel } from './level';
import { LightsView } from './LightsView';
import { DEFINITIONS_SPEC, LIGHTS_SPEC } from './specs';
import type { LevelLink } from './spec';
import { VesselView } from './VesselView';

// Chapter 1 of the arcade game: Rules of the Road. Level 1, Definitions, and
// level 2, Lights, play upright with one thumb (G8) and also work sideways and
// with a keyboard. `/rules/` is level 1, `/rules/?level=lights` is level 2, and
// level 2 stays shut until level 1 has a star (G12): a locked address opens
// level 1. `?seed=N` fixes the shuffle, for tests and the verification skill.

const params = new URLSearchParams(window.location.search);
const seedParam = Number(params.get('seed'));
const seed = Number.isSafeInteger(seedParam) && params.has('seed') ? seedParam : Date.now();
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const art = document.getElementById('art');
if (!art) throw new Error('#art is missing from rules/index.html');

/** Other levels keep a fixed seed when this page has one, so a test can walk from level to level. */
const withSeed = (path: string): string =>
  params.has('seed') ? `${path}${path.includes('?') ? '&' : '?'}seed=${seed}` : path;
const open = (level: LevelEntry): boolean => isUnlocked(level, loadStars);
const linkTo = (level: LevelEntry): LevelLink => {
  const after = RAPID_LEVELS.find((l) => l.id === level.after);
  return {
    label: levelTitle(level),
    href: open(level) ? withSeed(levelPath(level)) : null,
    note: after ? `Earn a star on ${after.number} · ${after.name}` : '',
  };
};

const requested = levelBySlug(params.get('level')) ?? RAPID_LEVELS[0];
if (!requested) throw new Error('no Chapter 1 levels');
// A shut level opens the first one instead of a dead page.
const current = open(requested) ? requested : (RAPID_LEVELS[0] ?? requested);
const common = {
  seed,
  sound: new Sound(),
  reducedMotion: () => motion.matches,
  now: () => performance.now(),
  home: () => window.location.assign('/'),
  levelLinks: () => RAPID_LEVELS.filter((l) => l.id !== current.id).map(linkTo),
  nextLevel: () => {
    const next = nextLevel(current);
    const link = next ? linkTo(next) : null;
    return link?.href ? link : null;
  },
};

if (current.slug === 'lights') {
  new RapidLevel({ ...common, spec: LIGHTS_SPEC, vessel: new LightsView(art) });
} else {
  new RapidLevel({ ...common, spec: DEFINITIONS_SPEC, vessel: new VesselView(art) });
}

void enableOffline();
