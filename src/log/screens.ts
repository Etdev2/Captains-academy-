// The vessel and role screens of the sea-time log, on the one /log page so
// they work offline with it. The address after # picks the screen:
//
//   #vessels           the vessel list
//   #vessels/new       a new vessel
//   #vessels/<id>      one vessel, to edit or delete
//   #roles             the role list
//
// Anything else shows the log's home screen.

import {
  missingDetails,
  type NewVessel,
  type Propulsion,
  type Role,
  type Vessel,
  type VesselDetail,
} from './entry';
import type { SeaLog } from './store';

const DETAIL_NAMES: Record<VesselDetail, string> = {
  officialNumber: 'official number',
  officialGrossTons: 'tonnage',
  lengthFeet: 'length',
  propulsion: 'propulsion',
  owner: 'owner',
  horsepower: 'horsepower',
  photo: 'photo',
};

/** The longest side of a saved photo, in pixels. Keeps the store small on a phone. */
const PHOTO_SIDE = 1280;

/** How long the delete button waits for its second tap, in milliseconds. */
const CONFIRM_MS = 4000;

type Route =
  | { readonly screen: 'home' }
  | { readonly screen: 'vessels' }
  | { readonly screen: 'vessel'; readonly id: string | null }
  | { readonly screen: 'roles' };

export function routeOf(hash: string): Route {
  const path = hash.replace(/^#\/?/, '');
  if (path === 'vessels') return { screen: 'vessels' };
  if (path === 'vessels/new') return { screen: 'vessel', id: null };
  const vessel = /^vessels\/([0-9a-f-]{36})$/i.exec(path);
  if (vessel?.[1]) return { screen: 'vessel', id: vessel[1] };
  if (path === 'roles') return { screen: 'roles' };
  return { screen: 'home' };
}

/** Reads an optional number from a form field. Blank is null; anything else must be above 0. */
export function parseAmount(text: string): number | null | 'invalid' {
  const trimmed = text.trim().replace(/,/g, '');
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value > 0 ? value : 'invalid';
}

function element<T extends HTMLElement>(id: string, type: new () => T): T {
  const found = document.getElementById(id);
  if (!(found instanceof type)) throw new Error(`log/index.html has no #${id}.`);
  return found;
}

function field<T extends HTMLInputElement | HTMLSelectElement>(
  form: HTMLFormElement,
  name: string,
  type: new () => T,
): T {
  const found = form.elements.namedItem(name);
  if (!(found instanceof type)) throw new Error(`The vessel form has no ${name} field.`);
  return found;
}

function summary(vessel: Vessel): string {
  const missing = missingDetails(vessel);
  if (missing.length === 0) {
    return [vessel.officialNumber, `${vessel.officialGrossTons} GRT`, `${vessel.lengthFeet} ft`]
      .filter(Boolean)
      .join(' · ');
  }
  return `Still to add: ${missing.map((detail) => DETAIL_NAMES[detail]).join(', ')}`;
}

/** Shrinks a picture to at most PHOTO_SIDE on its longest side, as a JPEG. */
async function shrinkPhoto(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, PHOTO_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('No canvas to shrink the photo on.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('The photo could not be saved.'))),
        'image/jpeg',
        0.85,
      ),
    );
  } finally {
    bitmap.close();
  }
}

export function startScreens(log: SeaLog): void {
  const views = {
    home: element('view-home', HTMLDivElement),
    vessels: element('view-vessels', HTMLElement),
    vessel: element('view-vessel-form', HTMLElement),
    roles: element('view-roles', HTMLElement),
  };
  const vesselList = element('vessel-list', HTMLUListElement);
  const vesselsEmpty = element('vessels-empty', HTMLParagraphElement);
  const vesselsStatus = element('vessels-status', HTMLParagraphElement);
  const form = element('vessel-form', HTMLFormElement);
  const formTitle = element('vessel-form-title', HTMLHeadingElement);
  const formError = element('vessel-form-error', HTMLParagraphElement);
  const deleteButton = element('delete-vessel', HTMLButtonElement);
  const preview = element('vessel-photo-preview', HTMLImageElement);
  const removePhoto = element('remove-photo', HTMLButtonElement);
  const photoStatus = element('photo-status', HTMLParagraphElement);
  const saveButton = element('save-vessel', HTMLButtonElement);
  const fields = {
    name: field(form, 'name', HTMLInputElement),
    officialNumber: field(form, 'officialNumber', HTMLInputElement),
    officialGrossTons: field(form, 'officialGrossTons', HTMLInputElement),
    lengthFeet: field(form, 'lengthFeet', HTMLInputElement),
    propulsion: field(form, 'propulsion', HTMLSelectElement),
    owner: field(form, 'owner', HTMLInputElement),
    horsepower: field(form, 'horsepower', HTMLInputElement),
    defaultRoleId: field(form, 'defaultRoleId', HTMLSelectElement),
    photo: field(form, 'photo', HTMLInputElement),
  };

  // The vessel being edited, null for a new one.
  let editing: Vessel | null = null;
  // The photo the form will save: the saved one, a new one, or none.
  let photo: Blob | null = null;
  let previewUrl: string | null = null;
  let confirmTimer: ReturnType<typeof setTimeout> | undefined;
  // Each render gets a number, so a slow one never overwrites a newer screen.
  let renderCount = 0;
  // Each photo picked gets a number too. Shrinking one takes a moment on a
  // phone, so a result counts only while its photo is still the latest one
  // picked on the form that picked it. Until then the form can't be saved.
  let photoCount = 0;
  let photoPending = false;

  const show = (screen: keyof typeof views) => {
    for (const [name, view] of Object.entries(views)) view.hidden = name !== screen;
    document.body.dataset.screen = screen;
  };

  const showError = (text: string | null) => {
    formError.hidden = text === null;
    formError.textContent = text ?? '';
  };

  const showPhoto = (blob: Blob | null) => {
    photo = blob;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = blob ? URL.createObjectURL(blob) : null;
    preview.hidden = previewUrl === null;
    removePhoto.hidden = previewUrl === null;
    if (previewUrl) preview.src = previewUrl;
    else preview.removeAttribute('src');
  };

  const setPhotoPending = (pending: boolean) => {
    photoPending = pending;
    saveButton.disabled = pending;
    photoStatus.textContent = pending ? 'Preparing the photo…' : '';
  };

  // Drops any photo still being prepared, so its result is ignored.
  const forgetPendingPhoto = () => {
    photoCount++;
    setPhotoPending(false);
  };

  const disarmDelete = () => {
    clearTimeout(confirmTimer);
    delete deleteButton.dataset.confirm;
    deleteButton.textContent = 'Delete vessel';
  };

  const fillRoles = (roles: readonly Role[]) => {
    const select = fields.defaultRoleId;
    select.replaceChildren(new Option('None', ''));
    for (const category of ['deck', 'engine'] as const) {
      const group = document.createElement('optgroup');
      group.label = category === 'deck' ? 'Deck' : 'Engine';
      for (const role of roles.filter((r) => r.category === category)) {
        group.append(new Option(role.label, role.id));
      }
      select.append(group);
    }
  };

  const renderVessels = async (turn: number) => {
    const vessels = await log.vessels.list();
    if (turn !== renderCount) return;
    vesselList.replaceChildren(
      ...vessels.map((vessel) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.className = 'row';
        link.href = `#vessels/${vessel.id}`;
        link.dataset.vesselId = vessel.id;
        const name = document.createElement('strong');
        name.textContent = vessel.name;
        const details = document.createElement('span');
        details.textContent = summary(vessel);
        link.append(name, details);
        item.append(link);
        return item;
      }),
    );
    vesselsEmpty.hidden = vessels.length > 0;
    show('vessels');
  };

  const renderVessel = async (turn: number, id: string | null) => {
    const [roles, vessel] = await Promise.all([
      log.roles.list(),
      id === null ? Promise.resolve(undefined) : log.vessels.get(id),
    ]);
    if (turn !== renderCount) return;
    if (id !== null && (!vessel || vessel.deletedAt !== null)) {
      vesselsStatus.textContent = 'That vessel is not in the log.';
      location.hash = '#vessels';
      return;
    }
    editing = vessel ?? null;
    form.reset();
    fillRoles(roles);
    showError(null);
    disarmDelete();
    formTitle.textContent = editing ? `Edit ${editing.name}` : 'New vessel';
    deleteButton.hidden = editing === null;
    fields.name.value = editing?.name ?? '';
    fields.officialNumber.value = editing?.officialNumber ?? '';
    fields.officialGrossTons.value = String(editing?.officialGrossTons ?? '');
    fields.lengthFeet.value = String(editing?.lengthFeet ?? '');
    fields.propulsion.value = editing?.propulsion ?? '';
    fields.owner.value = editing?.owner ?? '';
    fields.horsepower.value = String(editing?.horsepower ?? '');
    fields.defaultRoleId.value = editing?.defaultRoleId ?? '';
    forgetPendingPhoto();
    showPhoto(editing?.photo ?? null);
    show('vessel');
  };

  const renderRoles = async (turn: number) => {
    const roles = await log.roles.list();
    if (turn !== renderCount) return;
    for (const category of ['deck', 'engine'] as const) {
      element(`roles-${category}`, HTMLUListElement).replaceChildren(
        ...roles
          .filter((role) => role.category === category)
          .map((role) => {
            const item = document.createElement('li');
            item.className = 'row';
            item.dataset.roleId = role.id;
            item.textContent = role.label;
            return item;
          }),
      );
    }
    show('roles');
  };

  const render = async () => {
    const turn = ++renderCount;
    const route = routeOf(location.hash);
    if (route.screen !== 'vessels') vesselsStatus.textContent = '';
    try {
      switch (route.screen) {
        case 'home':
          show('home');
          break;
        case 'vessels':
          await renderVessels(turn);
          break;
        case 'vessel':
          await renderVessel(turn, route.id);
          break;
        case 'roles':
          await renderRoles(turn);
          break;
      }
    } catch {
      if (turn !== renderCount) return;
      vesselsStatus.textContent = 'This part of the log could not be read. Nothing was changed.';
      show('vessels');
    }
    window.scrollTo(0, 0);
  };

  // Reads the form into a vessel, or says what to fix.
  const readForm = (): NewVessel | string => {
    const name = fields.name.value.trim();
    if (name === '') return 'Give the vessel a name.';
    const amounts = {
      officialGrossTons: parseAmount(fields.officialGrossTons.value),
      lengthFeet: parseAmount(fields.lengthFeet.value),
      horsepower: parseAmount(fields.horsepower.value),
    };
    const labels = { officialGrossTons: 'Tonnage', lengthFeet: 'Length', horsepower: 'Horsepower' };
    for (const [key, value] of Object.entries(amounts)) {
      if (value === 'invalid') {
        return `${labels[key as keyof typeof labels]} must be a number above 0, or blank.`;
      }
    }
    const text = (input: HTMLInputElement) => input.value.trim() || null;
    const number = (value: number | null | 'invalid') => (value === 'invalid' ? null : value);
    return {
      id: editing?.id ?? crypto.randomUUID(),
      name,
      officialNumber: text(fields.officialNumber),
      officialGrossTons: number(amounts.officialGrossTons),
      lengthFeet: number(amounts.lengthFeet),
      propulsion: (fields.propulsion.value || null) as Propulsion | null,
      owner: text(fields.owner),
      horsepower: number(amounts.horsepower),
      photo,
      defaultRoleId: fields.defaultRoleId.value || null,
    };
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    // A photo still being prepared would be left out of the save.
    if (photoPending) return;
    const vessel = readForm();
    if (typeof vessel === 'string') {
      showError(vessel);
      return;
    }
    void log.vessels.save(vessel).then(
      (saved) => {
        vesselsStatus.textContent = `Saved ${saved.name}.`;
        location.hash = '#vessels';
      },
      () => showError('The vessel could not be saved. Nothing was changed.'),
    );
  });

  fields.photo.addEventListener('change', () => {
    const file = fields.photo.files?.[0];
    if (!file) return;
    showError(null);
    const turn = ++photoCount;
    const screen = renderCount;
    const current = () => turn === photoCount && screen === renderCount;
    setPhotoPending(true);
    shrinkPhoto(file).then(
      (blob) => {
        if (!current()) return;
        setPhotoPending(false);
        showPhoto(blob);
      },
      () => {
        if (!current()) return;
        setPhotoPending(false);
        showError('That picture could not be read. Try another one.');
      },
    );
  });

  removePhoto.addEventListener('click', () => {
    fields.photo.value = '';
    forgetPendingPhoto();
    showPhoto(null);
  });

  // Two taps, so a stray thumb on a moving deck can't delete a vessel.
  deleteButton.addEventListener('click', () => {
    if (!editing) return;
    if (deleteButton.dataset.confirm !== 'armed') {
      deleteButton.dataset.confirm = 'armed';
      deleteButton.textContent = 'Tap again to delete';
      confirmTimer = setTimeout(disarmDelete, CONFIRM_MS);
      return;
    }
    disarmDelete();
    const { id, name } = editing;
    void log.vessels.softDelete(id).then(
      () => {
        vesselsStatus.textContent = `Deleted ${name}.`;
        location.hash = '#vessels';
      },
      () => showError('The vessel could not be deleted. Nothing was changed.'),
    );
  });

  window.addEventListener('hashchange', () => void render());
  void render();
}
