// Progress saved on the device (DECISIONS.md G4): the best docking time and
// the most stars per mission. Storage can be missing or blocked, so every call
// is guarded and the game plays the same without it.

const key = (kind: string, missionId: string): string => `captains-academy:${kind}:${missionId}`;

function read(k: string): number | null {
  try {
    const raw = window.localStorage.getItem(k);
    const value = raw === null ? NaN : Number(raw);
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function write(k: string, value: number): void {
  try {
    window.localStorage.setItem(k, String(value));
  } catch {
    // Private windows and blocked storage just skip saving.
  }
}

export const loadBestFrames = (missionId: string): number | null => read(key('best', missionId));
export const saveBestFrames = (missionId: string, frames: number): void =>
  write(key('best', missionId), frames);

export const loadStars = (missionId: string): number => read(key('stars', missionId)) ?? 0;
export function saveStars(missionId: string, stars: number): void {
  if (stars > loadStars(missionId)) write(key('stars', missionId), stars);
}
