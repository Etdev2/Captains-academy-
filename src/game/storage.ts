// Progress saved on the device (DECISIONS.md G4): the best docking time per
// mission, in frames. Storage can be missing or blocked, so every call is
// guarded and the game plays the same without it.

const key = (missionId: string): string => `captains-academy:best:${missionId}`;

export function loadBestFrames(missionId: string): number | null {
  try {
    const raw = window.localStorage.getItem(key(missionId));
    const value = raw === null ? NaN : Number(raw);
    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function saveBestFrames(missionId: string, frames: number): void {
  try {
    window.localStorage.setItem(key(missionId), String(frames));
  } catch {
    // Private windows and blocked storage just skip saving.
  }
}
