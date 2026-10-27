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

// One mastery record per situation, shared later with the flashcards (G9):
// how often it was answered right and wrong, and the current streak.
export interface Mastery {
  right: number;
  wrong: number;
  streak: number;
}

export function loadMastery(situationId: string): Mastery {
  try {
    const raw = window.localStorage.getItem(`captains-academy:mastery:${situationId}`);
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const m = parsed as Partial<Mastery>;
      if (Number.isInteger(m.right) && Number.isInteger(m.wrong) && Number.isInteger(m.streak)) {
        return { right: m.right ?? 0, wrong: m.wrong ?? 0, streak: m.streak ?? 0 };
      }
    }
  } catch {
    // Unreadable or blocked storage starts the record fresh.
  }
  return { right: 0, wrong: 0, streak: 0 };
}

export function recordAnswer(situationId: string, correct: boolean): void {
  const m = loadMastery(situationId);
  const next: Mastery = correct
    ? { right: m.right + 1, wrong: m.wrong, streak: m.streak + 1 }
    : { right: m.right, wrong: m.wrong + 1, streak: 0 };
  try {
    window.localStorage.setItem(`captains-academy:mastery:${situationId}`, JSON.stringify(next));
  } catch {
    // Not saved; the level plays the same.
  }
}
