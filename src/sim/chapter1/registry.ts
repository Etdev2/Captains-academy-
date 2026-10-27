// The Chapter 1 levels that play at /rules, in order (ADR 0006's registry,
// kept to what exists). A level opens once the one before it has a star (G12).
// Pure data, so the page, the menu and the tests read one list.

export interface LevelEntry {
  readonly id: string;
  readonly number: number;
  readonly name: string;
  /** The `?level=` value that opens it. The first level is also the default. */
  readonly slug: string;
  /** The level that must hold a star first, or null for an open level. */
  readonly after: string | null;
}

export const RAPID_LEVELS: readonly LevelEntry[] = [
  { id: 'ch1-definitions', number: 1, name: 'Definitions', slug: 'definitions', after: null },
  { id: 'ch1-lights', number: 2, name: 'Lights', slug: 'lights', after: 'ch1-definitions' },
];

export const levelBySlug = (slug: string | null): LevelEntry | undefined =>
  RAPID_LEVELS.find((l) => l.slug === slug);

export const levelById = (id: string): LevelEntry | undefined =>
  RAPID_LEVELS.find((l) => l.id === id);

/** The page that plays a level. The first level keeps the plain /rules/ address. */
export const levelPath = (level: LevelEntry): string =>
  level.after === null ? '/rules/' : `/rules/?level=${level.slug}`;

export const levelTitle = (level: LevelEntry): string => `${level.number} · ${level.name}`;

/** One star on the level before opens a level (G12). `starsOf` reads the saved stars. */
export function isUnlocked(level: LevelEntry, starsOf: (levelId: string) => number): boolean {
  return level.after === null || starsOf(level.after) >= 1;
}

/** The level after this one, if there is one. */
export function nextLevel(level: LevelEntry): LevelEntry | undefined {
  return RAPID_LEVELS.find((l) => l.after === level.id);
}
