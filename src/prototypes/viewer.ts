// The full-size viewer: the original image at its own proportions, with fit,
// 100% and step zoom, the item's details and, for a rated item, the rating
// form. It is a modal <dialog>, so Escape closes it and focus returns to the
// card that opened it.

import { append, element, h, plural } from './dom';
import { isReviewable, kindLabel, type Item } from './inventory';
import {
  canSeeResults,
  MAX_COMMENT,
  MAX_SCORE,
  MIN_SCORE,
  myReview,
  summarize,
  type Review,
} from './ratings';

export interface ReviewContext {
  readonly items: readonly Item[];
  readonly byId: ReadonlyMap<string, Item>;
  readonly question: string;
  imageUrl(item: Item): string | undefined;
  documentUrl(item: Item): string | undefined;
  reviewer(): string;
  book(): readonly Review[];
  /** Saves a rating; false when the browser refused storage. Throws on a bad rating. */
  save(review: Review): boolean;
}

/** Zoom steps, as a fraction of the image's own pixel size. */
const STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

export const formatAverage = (average: number) => average.toFixed(2);

export function createViewer(ctx: ReviewContext) {
  const dialog = element('viewer', HTMLDialogElement);
  const title = element('viewer-title', HTMLElement);
  const pane = element('viewer-pane', HTMLElement);
  const image = element('viewer-image', HTMLImageElement);
  const side = element('viewer-side', HTMLElement);
  const level = element('zoom-level', HTMLOutputElement);
  const original = element('viewer-original', HTMLAnchorElement);
  const zoomOut = element('zoom-out', HTMLButtonElement);
  const zoomIn = element('zoom-in', HTMLButtonElement);

  let current: Item | undefined;
  let opener: HTMLElement | null = null;
  /** Null while the image is fitted to the window. */
  let scale: number | null = null;

  const fitScale = () =>
    image.naturalWidth > 0 ? image.getBoundingClientRect().width / image.naturalWidth : 1;

  function showZoom(): void {
    pane.dataset.fit = String(scale === null);
    if (scale === null) {
      image.style.width = '';
      image.style.height = '';
      level.textContent = image.naturalWidth > 0 ? `Fit (${Math.round(fitScale() * 100)}%)` : 'Fit';
    } else {
      // Only the width is set; the height follows it, so proportions never change.
      image.style.width = `${Math.round(image.naturalWidth * scale)}px`;
      image.style.height = 'auto';
      level.textContent = `${Math.round(scale * 100)}%`;
    }
    const now = scale ?? fitScale();
    zoomOut.disabled = now <= (STEPS[0] ?? 0) + 1e-6;
    zoomIn.disabled = now >= (STEPS.at(-1) ?? 1) - 1e-6;
  }

  function zoom(direction: 1 | -1): void {
    const now = scale ?? fitScale();
    const next =
      direction > 0
        ? STEPS.find((s) => s > now + 1e-6)
        : [...STEPS].reverse().find((s) => s < now - 1e-6);
    if (next !== undefined) scale = next;
    showZoom();
  }

  element('zoom-fit', HTMLButtonElement).addEventListener('click', () => {
    scale = null;
    showZoom();
  });
  element('zoom-actual', HTMLButtonElement).addEventListener('click', () => {
    scale = 1;
    showZoom();
  });
  zoomIn.addEventListener('click', () => zoom(1));
  zoomOut.addEventListener('click', () => zoom(-1));
  image.addEventListener('load', () => {
    showZoom();
    const size = side.querySelector('[data-fact="size"]');
    if (size) size.textContent = `${image.naturalWidth} × ${image.naturalHeight} px`;
  });
  element('viewer-close', HTMLButtonElement).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    // A click on the backdrop lands on the dialog itself.
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    if (event.key === '+' || event.key === '=') zoom(1);
    else if (event.key === '-') zoom(-1);
    else if (event.key === '0') {
      scale = null;
      showZoom();
    } else return;
    event.preventDefault();
  });
  dialog.addEventListener('close', () => {
    image.removeAttribute('src');
    current = undefined;
    opener?.focus();
    opener = null;
  });

  function facts(item: Item): HTMLElement {
    const row = (label: string, value: string | Node, fact?: string) => [
      h('dt', {}, label),
      h('dd', { 'data-fact': fact }, value),
    ];
    const list = h('dl', { class: 'facts' });
    const rows = [
      row('Creator', item.creator),
      row('Type', kindLabel[item.kind]),
      row('Style', item.style),
      row('Screen or feature', item.feature),
      row('Device', item.device),
      row('Source', item.source),
      row('Image size', '…', 'size'),
      row('Id', item.id),
    ];
    if (item.notes !== '') rows.push(row('Notes', item.notes));
    for (const pair of rows) append(list, ...pair);
    return list;
  }

  function openButton(item: Item, label: string): HTMLButtonElement {
    const button = h('button', { type: 'button' }, label);
    button.addEventListener('click', () => open(item));
    return button;
  }

  function provenance(item: Item): HTMLElement | null {
    const board = item.extractedFrom === undefined ? undefined : ctx.byId.get(item.extractedFrom);
    if (board) {
      return h(
        'div',
        { class: 'notice', role: 'note' },
        h('strong', {}, 'Extracted detail. '),
        'A full-width row cropped from a comparison board, with nothing redrawn or added. ',
        openButton(board, 'View the source board'),
      );
    }
    const parts = ctx.items.filter((i) => i.extractedFrom === item.id);
    if (parts.length > 0) {
      return h(
        'div',
        { class: 'stack' },
        h(
          'p',
          {},
          'Comparison board, kept whole for reference and not rated. Its concepts are rated one by one:',
        ),
        h('div', { class: 'actions' }, ...parts.map((p) => openButton(p, p.style))),
      );
    }
    return null;
  }

  function caution(item: Item): HTMLElement {
    if (item.kind === 'app-screenshot') {
      return h('p', { class: 'muted' }, 'A screenshot of the app as built.');
    }
    // Everything else, reference boards and decks included, was generated as a design.
    return h(
      'p',
      { class: 'notice', role: 'note' },
      `${item.kind === 'concept' ? 'Visual concept' : 'Generated design reference'}. ` +
        'Generated lesson text and navigation diagrams require verification before instructional use.',
    );
  }

  function resultLine(item: Item): HTMLElement {
    const reviewer = ctx.reviewer();
    if (!canSeeResults(ctx.book(), reviewer, item.id)) {
      return h(
        'p',
        { class: 'muted' },
        "Other reviewers' scores appear here after you save yours.",
      );
    }
    const s = summarize(ctx.book(), item.id);
    return h(
      'p',
      {},
      'On this device: average ',
      h('strong', {}, s.average === null ? 'none' : formatAverage(s.average)),
      ` from ${plural(s.count, 'reviewer')}. Saved on this device, not shared team results.`,
    );
  }

  function ratingForm(item: Item): HTMLElement {
    const reviewer = ctx.reviewer();
    const mine = myReview(ctx.book(), reviewer, item.id);
    const form = h('form', { 'aria-label': 'Your rating' });
    const scale = h('div', { class: 'scale' });
    for (let n = MIN_SCORE; n <= MAX_SCORE; n++) {
      const input = h('input', {
        type: 'radio',
        name: 'score',
        value: n,
        'aria-label': `${n} of ${MAX_SCORE}`,
        checked: mine?.score === n,
      });
      append(scale, h('label', {}, input, h('span', { 'aria-hidden': 'true' }, n)));
    }
    const favorite = h('input', {
      type: 'checkbox',
      name: 'favorite',
      checked: mine?.favorite === true,
    });
    const comment = h('textarea', { name: 'comment', maxlength: MAX_COMMENT, rows: 3 });
    comment.value = mine?.comment ?? '';
    const status = h('p', { class: 'status', role: 'status' });
    const submit = h(
      'button',
      { type: 'submit', class: 'primary' },
      mine ? 'Update rating' : 'Save rating',
    );
    if (reviewer.trim() === '') {
      submit.disabled = true;
      status.textContent = 'Enter your name at the top of the page to rate.';
    } else if (mine) {
      status.textContent = `Your rating: ${mine.score}. Saved on this device.`;
    }
    append(
      form,
      h(
        'fieldset',
        {},
        h('legend', {}, ctx.question),
        scale,
        h(
          'ul',
          { class: 'anchors' },
          h('li', {}, '1 = strongly oppose this direction'),
          h('li', {}, '5 = mixed or undecided'),
          h('li', {}, '10 = strongly support this direction'),
        ),
        h('label', { class: 'inline' }, favorite, 'Mark as a favorite'),
        h('label', {}, 'Comment (optional)', comment),
        submit,
        status,
      ),
    );
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const picked = form.querySelector<HTMLInputElement>('input[name="score"]:checked');
      if (!picked) {
        status.dataset.tone = 'error';
        status.textContent = `Choose a score from ${MIN_SCORE} to ${MAX_SCORE} first. Unrated is not zero.`;
        return;
      }
      let kept: boolean;
      try {
        kept = ctx.save({
          itemId: item.id,
          reviewer,
          score: Number(picked.value),
          comment: comment.value,
          favorite: favorite.checked,
          updatedAt: new Date().toISOString(),
        });
      } catch {
        status.dataset.tone = 'error';
        status.textContent = 'That rating could not be saved. Check your name and score.';
        return;
      }
      renderSide(item);
      const after = side.querySelector<HTMLElement>('.status');
      if (after) {
        after.dataset.tone = kept ? '' : 'error';
        after.textContent = kept
          ? `Saved on this device: ${picked.value} of ${MAX_SCORE}.`
          : 'Saved in this tab only. This browser is blocking storage, so export your ratings before you close it.';
      }
      side.querySelector<HTMLButtonElement>('button[type="submit"]')?.focus();
    });
    return h('div', { class: 'stack' }, form, resultLine(item));
  }

  function renderSide(item: Item): void {
    side.replaceChildren();
    append(side, caution(item), provenance(item));
    if (isReviewable(item)) append(side, ratingForm(item));
    else if (item.kind === 'reference') {
      append(side, h('p', { class: 'muted' }, 'Reference material. Not rated or ranked.'));
    }
    const doc = ctx.documentUrl(item);
    if (doc)
      append(
        side,
        h('a', { class: 'button', href: doc, target: '_blank', rel: 'noopener' }, 'Open the PDF'),
      );
    append(side, facts(item));
    if (image.complete && image.naturalWidth > 0) {
      const size = side.querySelector('[data-fact="size"]');
      if (size) size.textContent = `${image.naturalWidth} × ${image.naturalHeight} px`;
    }
  }

  function open(item: Item, from?: HTMLElement): void {
    if (from) opener = from;
    current = item;
    scale = null;
    title.textContent = item.title;
    const src = ctx.imageUrl(item);
    if (src) {
      image.src = src;
      image.alt = item.title;
      original.href = src;
      original.hidden = false;
    } else {
      image.removeAttribute('src');
      original.hidden = true;
    }
    pane.hidden = src === undefined;
    renderSide(item);
    showZoom();
    if (!dialog.open) dialog.showModal();
    pane.scrollTo(0, 0);
  }

  return {
    open,
    /** Redraws the open item's details, after the reviewer's name changes. */
    refresh(): void {
      if (current && dialog.open) renderSide(current);
    },
  };
}
