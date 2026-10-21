// The sea-time entry screens of the log (issue #40): the home screen's check-in
// button and trip timer, the check-in sheet, backfilling past days after the
// user consents, and the list of entries with their edit screen. The router in
// src/log/screens.ts picks which one shows.
//
// What a day counts for is the Coast Guard's call. These screens only flag an
// entry under 4 hours as not eligible and show two notes that promise nothing
// (D1); they never work out a number of days.

import {
  BAND_LOWER_EDGE_HOURS,
  dayNoteFor,
  entryHours,
  isUnderFourHours,
  WATERS,
  type DayNote,
  type HoursBand,
  type NewSeaTimeEntry,
  type Role,
  type SeaTimeEntry,
  type Vessel,
  type Waters,
} from './entry';
import {
  ConsentRequiredError,
  FutureDayError,
  localDay,
  OpenTripError,
  UnknownRoleError,
  UnknownVesselError,
  type SeaLog,
} from './store';

export const WATERS_LABELS: Readonly<Record<Waters, string>> = {
  oceans: 'Oceans',
  'near-coastal': 'Near coastal',
  'great-lakes': 'Great Lakes',
  inland: 'Inland',
  'western-rivers': 'Western Rivers',
  'inside-passage': 'Inside Passage (Puget Sound to Cape Spencer)',
  rivers: 'Rivers',
};

export const BAND_LABELS: Readonly<Record<HoursBand, string>> = {
  'under-4': 'Under 4 hours',
  '4-8': '4 to 8 hours',
  '8-12': '8 to 12 hours',
  '12-plus': '12 hours or more',
};

/** Shown on every entry under 4 hours. The entry stays in the log (D1). */
export const UNDER_FOUR_FLAG = `Not eligible: under ${BAND_LOWER_EDGE_HOURS['4-8']} hours`;

/** Information only (D1). Nothing here is a promise, and no days are counted from it. */
export const DAY_NOTES: Readonly<Record<DayNote, string>> = {
  'short-day':
    'May count as a day only on vessels under 100 GRT if the Coast Guard accepts the schedule (46 CFR 10.232(h)(3)).',
  'two-watch':
    "On vessels authorized for two watches, a 12-hour day may be credited as 1½ days at the Coast Guard's discretion (46 CFR 10.232(h)(2)). Not guaranteed.",
};

/** How long the delete button waits for its second tap, in milliseconds. */
const CONFIRM_MS = 4000;

export function entryCountText(count: number): string {
  if (count === 0) return 'No sea time logged yet.';
  if (count === 1) return '1 entry saved on this phone.';
  return `${count} entries saved on this phone.`;
}

/** A duration in hours as "5 h 12 min". */
export function formatHours(hours: number): string {
  const minutes = Math.max(0, Math.floor(hours * 60));
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
}

/** A running trip's time as "1:05:32", so the timer visibly ticks. */
export function formatClock(hours: number): string {
  const seconds = Math.max(0, Math.floor(hours * 3600));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${Math.floor(seconds / 3600)}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
}

/** An instant as the value of a datetime-local field, in this device's time. */
export function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${localDay(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** A datetime-local field's value as an instant, or null when it is blank or not a time. */
export function fromLocalInput(value: string): string | null {
  if (value === '') return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : new Date(time).toISOString();
}

const isWaters = (value: string): value is Waters => (WATERS as readonly string[]).includes(value);

const isBand = (value: string): value is HoursBand => value in BAND_LABELS;

function element<T extends HTMLElement>(id: string, type: new () => T): T {
  const found = document.getElementById(id);
  if (!(found instanceof type)) throw new Error(`log/index.html has no #${id}.`);
  return found;
}

function inside<T extends Element>(root: ParentNode, selector: string, type: new () => T): T {
  const found = root.querySelector(selector);
  if (!(found instanceof type)) throw new Error(`log/index.html has no ${selector} there.`);
  return found;
}

/** What a failed save says to the user. */
function saveErrorText(error: unknown): string {
  if (error instanceof OpenTripError) return 'A trip is already open. Check out of it first.';
  if (error instanceof ConsentRequiredError) return 'Agree to backfilling first.';
  if (error instanceof FutureDayError) return "That day hasn't happened yet.";
  if (error instanceof UnknownVesselError) return 'Pick a vessel that is in your list.';
  if (error instanceof UnknownRoleError) return 'Pick a role from the list.';
  return 'The entry could not be saved. Nothing was changed.';
}

/** The vessel, role and waters pickers that the check-in, backfill and edit forms share. */
class AboardFields {
  readonly vessel: HTMLSelectElement;
  readonly role: HTMLSelectElement;
  readonly waters: HTMLSelectElement;
  private vessels: readonly Vessel[] = [];

  constructor(form: HTMLFormElement) {
    this.vessel = inside(form, 'select[name="vesselId"]', HTMLSelectElement);
    this.role = inside(form, 'select[name="roleId"]', HTMLSelectElement);
    this.waters = inside(form, 'select[name="waters"]', HTMLSelectElement);
    // A vessel's usual role is picked for the user when they pick the vessel.
    this.vessel.addEventListener('change', () => {
      const chosen = this.vessels.find((vessel) => vessel.id === this.vessel.value);
      if (chosen?.defaultRoleId) this.role.value = chosen.defaultRoleId;
    });
  }

  fill(vessels: readonly Vessel[], roles: readonly Role[]): void {
    this.vessels = vessels;
    this.vessel.replaceChildren(
      new Option('Pick a vessel', ''),
      ...vessels.map((vessel) => {
        const label = vessel.deletedAt === null ? vessel.name : `${vessel.name} (deleted)`;
        return new Option(label, vessel.id);
      }),
    );
    this.role.replaceChildren(new Option('Pick your role', ''));
    for (const category of ['deck', 'engine'] as const) {
      const group = document.createElement('optgroup');
      group.label = category === 'deck' ? 'Deck' : 'Engine';
      for (const role of roles.filter((r) => r.category === category)) {
        group.append(new Option(role.label, role.id));
      }
      this.role.append(group);
    }
    this.waters.replaceChildren(
      new Option('Pick the waters', ''),
      ...WATERS.map((waters) => new Option(WATERS_LABELS[waters], waters)),
    );
  }

  /** Picks these values, each only if it is on its list. */
  set(choice: {
    vesselId?: string | null | undefined;
    roleId?: string | null | undefined;
    waters?: string | null | undefined;
  }) {
    const pick = (select: HTMLSelectElement, value: string | null | undefined) => {
      if (value && [...select.options].some((option) => option.value === value)) {
        select.value = value;
      }
    };
    pick(this.vessel, choice.vesselId);
    const vessel = this.vessels.find((v) => v.id === this.vessel.value);
    pick(this.role, choice.roleId ?? vessel?.defaultRoleId);
    pick(this.waters, choice.waters);
  }

  /** The chosen vessel, role and confirmed waters, or what is still missing. */
  read(): { vesselId: string; roleId: string; waters: Waters } | string {
    if (this.vessel.value === '') return 'Pick the vessel.';
    if (this.role.value === '') return 'Pick your role aboard.';
    if (!isWaters(this.waters.value)) return 'Pick the waters.';
    return { vesselId: this.vessel.value, roleId: this.role.value, waters: this.waters.value };
  }
}

/** A form's error line. */
function errorLine(form: HTMLFormElement): (text: string | null) => void {
  const line = inside(form, '.error', HTMLParagraphElement);
  return (text) => {
    line.hidden = text === null;
    line.textContent = text ?? '';
  };
}

export type EntryScreen = 'home' | 'checkIn' | 'backfill' | 'entries' | 'entry';

export interface EntryScreens {
  home(isCurrent: () => boolean): Promise<void>;
  checkIn(isCurrent: () => boolean): Promise<void>;
  backfill(isCurrent: () => boolean): Promise<void>;
  entries(isCurrent: () => boolean): Promise<void>;
  entry(isCurrent: () => boolean, id: string): Promise<void>;
}

export function createEntryScreens(log: SeaLog, show: (screen: EntryScreen) => void): EntryScreens {
  const count = element('entries', HTMLParagraphElement);
  const homeStatus = element('home-status', HTMLParagraphElement);
  const checkInButton = element('check-in', HTMLButtonElement);
  const tripStatus = element('trip-status', HTMLParagraphElement);

  const checkInView = element('view-check-in', HTMLElement);
  const checkInForm = element('check-in-form', HTMLFormElement);
  const checkInFields = new AboardFields(checkInForm);
  const checkInError = errorLine(checkInForm);

  const backfillView = element('view-backfill', HTMLElement);
  const consent = element('consent', HTMLElement);
  const giveConsent = element('give-consent', HTMLButtonElement);
  const backfillForm = element('backfill-form', HTMLFormElement);
  const backfillFields = new AboardFields(backfillForm);
  const backfillError = errorLine(backfillForm);
  const backfillStatus = element('backfill-status', HTMLParagraphElement);
  const backfillDay = inside(backfillForm, 'input[name="day"]', HTMLInputElement);

  const entryList = element('entry-list', HTMLUListElement);
  const entriesEmpty = element('entries-empty', HTMLParagraphElement);
  const entriesStatus = element('entries-status', HTMLParagraphElement);

  const entryForm = element('entry-form', HTMLFormElement);
  const entryFields = new AboardFields(entryForm);
  const entryError = errorLine(entryForm);
  const entryTitle = element('entry-title', HTMLHeadingElement);
  const entrySource = element('entry-source', HTMLParagraphElement);
  const deleteEntry = element('delete-entry', HTMLButtonElement);
  const startedAt = inside(entryForm, 'input[name="startedAt"]', HTMLInputElement);
  const endedAt = inside(entryForm, 'input[name="endedAt"]', HTMLInputElement);
  const editDay = inside(entryForm, 'input[name="day"]', HTMLInputElement);
  const editBand = inside(entryForm, 'select[name="hoursBand"]', HTMLSelectElement);
  const liveFields = inside(entryForm, '.live-fields', HTMLDivElement);
  const backfilledFields = inside(entryForm, '.backfilled-fields', HTMLDivElement);
  const endedLabel = inside(entryForm, 'label.ended', HTMLLabelElement);
  const openNote = inside(entryForm, '.open-note', HTMLParagraphElement);

  // The trip the home screen shows, and the timer that counts it up.
  let trip: SeaTimeEntry | undefined;
  let tripTimer: ReturnType<typeof setInterval> | undefined;
  // The entry being edited.
  let editing: SeaTimeEntry | undefined;
  let confirmTimer: ReturnType<typeof setTimeout> | undefined;
  // True while a save is on its way to the store, so a second tap can't
  // check in twice or save the same backfilled day twice.
  let saving = false;
  // How many vessels the backfill screen last offered.
  let backfillVessels = 0;

  const vesselNames = new Map<string, string>();
  const roleLabels = new Map<string, string>();

  // The vessels to pick from: those not deleted, plus the one an entry already has.
  const loadChoices = async (keepVesselId: string | null = null) => {
    const [vessels, roles] = await Promise.all([log.vessels.list(), log.roles.list()]);
    if (keepVesselId && !vessels.some((vessel) => vessel.id === keepVesselId)) {
      const kept = await log.vessels.get(keepVesselId);
      if (kept) vessels.push(kept);
    }
    for (const vessel of vessels) vesselNames.set(vessel.id, vessel.name);
    for (const role of roles) roleLabels.set(role.id, role.label);
    return { vessels, roles };
  };

  const showTrip = () => {
    clearInterval(tripTimer);
    if (!trip || trip.source !== 'live') {
      tripStatus.dataset.state = 'closed';
      tripStatus.textContent = 'Not checked in.';
      checkInButton.textContent = 'Check in';
      return;
    }
    const open = trip;
    const vessel = (open.vesselId && vesselNames.get(open.vesselId)) ?? 'your vessel';
    const tick = () => {
      const hours = (Date.now() - Date.parse(open.startedAt)) / 3_600_000;
      tripStatus.textContent = `Underway on ${vessel} for ${formatClock(hours)}.`;
    };
    tripStatus.dataset.state = 'open';
    checkInButton.textContent = 'Check out';
    tick();
    tripTimer = setInterval(tick, 1000);
  };

  const refreshHome = async () => {
    const [entries, open] = await Promise.all([log.count(), log.openTrip(), loadChoices()]);
    count.dataset.count = String(entries);
    count.textContent = entryCountText(entries);
    trip = open;
    showTrip();
    checkInButton.disabled = false;
  };

  checkInButton.addEventListener('click', () => {
    if (saving) return;
    if (!trip) {
      location.hash = '#check-in';
      return;
    }
    saving = true;
    checkInButton.disabled = true;
    log
      .checkOut()
      .then((ended) => {
        if (ended) {
          const hours = entryHours(ended) ?? 0;
          homeStatus.textContent = isUnderFourHours(ended)
            ? `Checked out after ${formatHours(hours)}. ${UNDER_FOUR_FLAG}.`
            : `Checked out after ${formatHours(hours)}.`;
        }
      })
      .catch(() => {
        homeStatus.textContent =
          'The trip could not be checked out. Open it in the log and add its vessel, role and waters.';
      })
      .finally(() => {
        saving = false;
        void refreshHome();
      });
  });

  checkInForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (saving) return;
    const aboard = checkInFields.read();
    if (typeof aboard === 'string') {
      checkInError(aboard);
      return;
    }
    saving = true;
    log.checkIn(aboard).then(
      () => {
        saving = false;
        homeStatus.textContent = `Checked in on ${vesselNames.get(aboard.vesselId) ?? 'your vessel'}.`;
        location.hash = '#';
      },
      (error: unknown) => {
        saving = false;
        checkInError(saveErrorText(error));
      },
    );
  });

  giveConsent.addEventListener('click', () => {
    void log.giveBackfillConsent().then(() => {
      consent.hidden = true;
      inside(backfillView, '.no-vessels', HTMLParagraphElement).hidden = backfillVessels > 0;
      backfillForm.hidden = backfillVessels === 0;
    });
  });

  backfillForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (saving) return;
    const aboard = backfillFields.read();
    const band = backfillForm.querySelector<HTMLInputElement>('input[name="hoursBand"]:checked');
    if (backfillDay.value === '') {
      backfillError('Pick the day.');
      return;
    }
    if (!band || !isBand(band.value)) {
      backfillError('Pick the hours for that day.');
      return;
    }
    if (typeof aboard === 'string') {
      backfillError(aboard);
      return;
    }
    const hoursBand = band.value;
    saving = true;
    backfillError(null);
    log.backfill({ ...aboard, day: backfillDay.value, hoursBand }).then(
      (saved) => {
        saving = false;
        const flag = isUnderFourHours(saved) ? ` ${UNDER_FOUR_FLAG}.` : '';
        backfillStatus.textContent = `Saved ${backfillDay.value} as backfilled, ${BAND_LABELS[hoursBand].toLowerCase()}.${flag}`;
        // Ready for the next day, with the same vessel, role and waters.
        backfillDay.value = '';
        band.checked = false;
      },
      (error: unknown) => {
        saving = false;
        backfillError(saveErrorText(error));
      },
    );
  });

  const disarmDelete = () => {
    clearTimeout(confirmTimer);
    delete deleteEntry.dataset.confirm;
    deleteEntry.textContent = 'Delete entry';
  };

  // Two taps, so a stray thumb on a moving deck can't delete an entry.
  deleteEntry.addEventListener('click', () => {
    if (!editing) return;
    if (deleteEntry.dataset.confirm !== 'armed') {
      deleteEntry.dataset.confirm = 'armed';
      deleteEntry.textContent = 'Tap again to delete';
      confirmTimer = setTimeout(disarmDelete, CONFIRM_MS);
      return;
    }
    disarmDelete();
    void log.softDelete(editing.id).then(
      () => {
        entriesStatus.textContent = 'Entry deleted.';
        location.hash = '#entries';
      },
      () => entryError('The entry could not be deleted. Nothing was changed.'),
    );
  });

  entryForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (saving || !editing) return;
    const aboard = entryFields.read();
    if (typeof aboard === 'string') {
      entryError(aboard);
      return;
    }
    let changed: NewSeaTimeEntry;
    const common = { id: editing.id, ...aboard, watersSuggestion: editing.watersSuggestion };
    if (editing.source === 'live') {
      // A time field holds whole minutes, so a time the user left alone keeps
      // its seconds.
      const keep = (input: HTMLInputElement, saved: string) =>
        input.value === toLocalInput(saved) ? saved : fromLocalInput(input.value);
      const start = keep(startedAt, editing.startedAt);
      const end = editing.endedAt === null ? null : keep(endedAt, editing.endedAt);
      if (start === null || (editing.endedAt !== null && end === null)) {
        entryError('Give the check-in and check-out times.');
        return;
      }
      if (end !== null && end < start) {
        entryError('The check-out has to come after the check-in.');
        return;
      }
      changed = { ...common, source: 'live', startedAt: start, endedAt: end };
    } else {
      if (editDay.value === '' || !isBand(editBand.value)) {
        entryError('Give the day and its hours.');
        return;
      }
      changed = { ...common, source: 'backfilled', day: editDay.value, hoursBand: editBand.value };
    }
    saving = true;
    log.save(changed).then(
      () => {
        saving = false;
        entriesStatus.textContent = 'Entry saved.';
        location.hash = '#entries';
      },
      (error: unknown) => {
        saving = false;
        entryError(saveErrorText(error));
      },
    );
  });

  const describe = (entry: SeaTimeEntry): HTMLLIElement => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'row';
    link.href = `#entries/${entry.id}`;
    link.dataset.entryId = entry.id;
    link.dataset.source = entry.source;

    const line = (className: string, text: string) => {
      const span = document.createElement('span');
      span.className = className;
      span.textContent = text;
      link.append(span);
      return span;
    };

    const tag = entry.source === 'backfilled' ? 'Backfilled' : 'Live';
    const when =
      entry.source === 'backfilled'
        ? entry.day
        : new Date(entry.startedAt).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          });
    const title = document.createElement('strong');
    title.textContent = when;
    link.append(title);
    line('tag', tag);

    const vessel = entry.vesselId ? (vesselNames.get(entry.vesselId) ?? 'A deleted vessel') : null;
    const role = entry.roleId ? (roleLabels.get(entry.roleId) ?? entry.roleId) : null;
    const waters = entry.waters ? WATERS_LABELS[entry.waters] : null;
    line(
      'aboard',
      vessel && role && waters
        ? `${vessel} · ${role} · ${waters}`
        : 'Vessel, role or waters not recorded yet.',
    );

    if (entry.source === 'backfilled') {
      line('hours', BAND_LABELS[entry.hoursBand]);
    } else if (entry.endedAt === null) {
      line('hours trip-open', 'Underway now');
    } else {
      line('hours', formatHours(entryHours(entry) ?? 0));
    }

    // Flagged, never hidden or deleted (D1).
    if (isUnderFourHours(entry)) line('flag', UNDER_FOUR_FLAG);
    const note = dayNoteFor(entry);
    if (note) line('day-note', DAY_NOTES[note]).dataset.note = note;

    item.append(link);
    return item;
  };

  const sortKey = (entry: SeaTimeEntry) =>
    entry.source === 'live' ? entry.startedAt : `${entry.day}T00:00:00.000Z`;

  return {
    async home(isCurrent) {
      await refreshHome();
      if (isCurrent()) show('home');
    },

    async checkIn(isCurrent) {
      const [{ vessels, roles }, last, open] = await Promise.all([
        loadChoices(),
        log.lastCheckIn(),
        log.openTrip(),
      ]);
      if (!isCurrent()) return;
      if (open) {
        homeStatus.textContent = 'A trip is already open. Check out of it first.';
        location.hash = '#';
        return;
      }
      checkInError(null);
      checkInFields.fill(vessels, roles);
      // The last check-in's choices, so checking in again is one tap.
      checkInFields.set(last ?? { vesselId: vessels.length === 1 ? vessels[0]?.id : null });
      inside(checkInView, '.no-vessels', HTMLParagraphElement).hidden = vessels.length > 0;
      checkInForm.hidden = vessels.length === 0;
      show('checkIn');
    },

    async backfill(isCurrent) {
      const [{ vessels, roles }, given, last] = await Promise.all([
        loadChoices(),
        log.backfillConsent(),
        log.lastCheckIn(),
      ]);
      if (!isCurrent()) return;
      backfillError(null);
      backfillStatus.textContent = '';
      backfillFields.fill(vessels, roles);
      backfillFields.set(last ?? { vesselId: vessels.length === 1 ? vessels[0]?.id : null });
      backfillDay.max = localDay(new Date());
      backfillVessels = vessels.length;
      const noVessels = inside(backfillView, '.no-vessels', HTMLParagraphElement);
      // No backfilling until the user consents (D1).
      consent.hidden = given !== undefined;
      noVessels.hidden = given === undefined || vessels.length > 0;
      backfillForm.hidden = given === undefined || vessels.length === 0;
      show('backfill');
    },

    async entries(isCurrent) {
      const [entries] = await Promise.all([log.list(), loadChoices()]);
      // Vessels deleted since an entry was saved still show their names.
      for (const entry of entries) {
        if (entry.vesselId && !vesselNames.has(entry.vesselId)) {
          const vessel = await log.vessels.get(entry.vesselId);
          if (vessel) vesselNames.set(vessel.id, vessel.name);
        }
      }
      if (!isCurrent()) return;
      const newestFirst = [...entries].sort((a, b) => sortKey(b).localeCompare(sortKey(a)));
      entryList.replaceChildren(...newestFirst.map(describe));
      entriesEmpty.hidden = entries.length > 0;
      show('entries');
    },

    async entry(isCurrent, id) {
      const found = await log.get(id);
      const { vessels, roles } = await loadChoices(found?.vesselId ?? null);
      if (!isCurrent()) return;
      if (!found || found.deletedAt !== null) {
        entriesStatus.textContent = 'That entry is not in the log.';
        location.hash = '#entries';
        return;
      }
      editing = found;
      entryError(null);
      disarmDelete();
      entryFields.fill(vessels, roles);
      entryFields.set(found);
      const backfilled = found.source === 'backfilled';
      entryTitle.textContent = backfilled ? 'Edit backfilled day' : 'Edit live trip';
      entrySource.textContent = backfilled ? 'Backfilled' : 'Live';
      liveFields.hidden = backfilled;
      backfilledFields.hidden = !backfilled;
      if (found.source === 'live') {
        startedAt.value = toLocalInput(found.startedAt);
        const open = found.endedAt === null;
        endedLabel.hidden = open;
        openNote.hidden = !open;
        endedAt.value = open ? '' : toLocalInput(found.endedAt ?? found.startedAt);
      } else {
        editDay.value = found.day;
        editDay.max = localDay(new Date());
        editBand.value = found.hoursBand;
      }
      show('entry');
    },
  };
}
