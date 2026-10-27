import { requirements, TODAY, tasks, type Task } from '../shared/sample';

export type TaskFilter = 'all' | 'week' | 'overdue';

export const daysUntil = (iso: string): number =>
  Math.round((Date.parse(iso) - Date.parse(TODAY)) / 86_400_000);

export const fmtDate = (iso: string): string =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: iso.slice(0, 4) === TODAY.slice(0, 4) ? undefined : 'numeric',
    timeZone: 'UTC',
  });

export function dueText(t: Task): string {
  if (!t.due) return 'No deadline';
  const d = daysUntil(t.due);
  if (d < 0) return `Overdue by ${-d} days`;
  if (d === 0) return 'Due today';
  return `Due ${fmtDate(t.due)} · in ${d} days`;
}

export const isOverdue = (t: Task): boolean => t.due !== null && daysUntil(t.due) < 0;
export const isThisWeek = (t: Task): boolean =>
  t.due !== null && daysUntil(t.due) >= 0 && daysUntil(t.due) <= 7;

export function filterTasks(list: readonly Task[], f: TaskFilter): Task[] {
  if (f === 'overdue') return list.filter(isOverdue);
  if (f === 'week') return list.filter(isThisWeek);
  return [...list];
}

export const filterLabels: Record<TaskFilter, string> = {
  all: 'All',
  week: 'This week',
  overdue: 'Overdue',
};

export const areaLabel = {
  license: 'License & Forms',
  'sea-time': 'Sea Time',
  study: 'Study',
  arcade: 'Arcade',
} as const;

export const metCount = requirements.filter((r) => r.status === 'appears-met').length;
export const stillNeeded = requirements.filter((r) => r.status !== 'appears-met');
export const totalParts = requirements.length;

/** Tasks that have a date, soonest first. */
export const deadlines = tasks
  .filter((t): t is Task & { due: string } => t.due !== null)
  .sort((a, b) => a.due.localeCompare(b.due));

export const routeSteps = [
  'Pick license',
  'Credentials',
  'Sea time',
  'Exam',
  'Apply to NMC',
] as const;
/** Index of "you are here" on the route. */
export const routeHere = 2;
