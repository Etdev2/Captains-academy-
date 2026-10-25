// The prototype review gallery at /prototypes (issue #72): every Claude and
// ChatGPT prototype image, rated 1 to 10 by named reviewers, compared side by
// side and summarized. Ratings are saved on this device only (storage.ts);
// combining a team's ratings means importing the files each reviewer exports.
//
// The address after # picks the section: #gallery, #compare, #results or
// #reference.

import data from '../../docs/prototypes/inventory.json';
import { append, element, h, plural } from './dom';
import {
  ALL,
  categories,
  isReviewable,
  kindLabel,
  matches,
  parseInventory,
  thumbnailPath,
  type Filter,
  type Item,
} from './inventory';
import {
  canSeeResults,
  displayName,
  exportReviews,
  importReviews,
  MAX_SCORE,
  myReview,
  NotARatingsFileError,
  parseReviews,
  rankItems,
  reviewerKey,
  saveReview,
  type Ranked,
  type Review,
} from './ratings';
import { openReviewStore } from './storage';
import { createViewer, formatAverage } from './viewer';

// The images stay where they are in docs/; the build gives each one a URL.
// tests/prototype-inventory.test.ts checks every image sits under one of these folders.
const files = import.meta.glob<string>(
  ['/docs/prototypes/**/*.{png,jpg,pdf}', '/docs/design/screenshots/**/*.png'],
  { eager: true, query: '?url', import: 'default' },
);
const fileUrl = (repoPath: string | null | undefined) =>
  repoPath ? files[`/${repoPath}`] : undefined;

/** The playable arcade prototype. It lives on a private Claude page, not in this build. */
const NIGHT_HARBOR_RUN = 'https://claude.ai/artifact/QNbtXuSXRQzjc64s4LWbVU';
const COMPARE_MAX = 4;

const inventory = parseInventory(data);
const items = inventory.items;
const byId = new Map(items.map((i) => [i.id, i]));
const reviewable = items.filter(isReviewable);
const reviewableIds = reviewable.map((i) => i.id);
const reference = items.filter((i) => i.kind === 'reference' && i.availability === 'available');

declare global {
  interface Window {
    /**
     * Each item's built image and preview URL, for the browser tests in
     * e2e/prototypes.spec.ts, as the sea-time log exposes window.__seaTimeLog.
     */
    __prototypeGallery?: {
      readonly images: Readonly<Record<string, string>>;
      readonly thumbnails: Readonly<Record<string, string>>;
    };
  }
}

const urls = (path: (item: Item) => string | null | undefined) =>
  Object.fromEntries(
    items.flatMap((i) => {
      const url = fileUrl(path(i));
      return url === undefined ? [] : [[i.id, url]];
    }),
  );
window.__prototypeGallery = { images: urls((i) => i.image), thumbnails: urls(thumbnailPath) };

const store = openReviewStore(parseReviews);
let book: Review[] = store.load();
let reviewer = store.loadName();
let filter: Filter = { style: ALL, feature: ALL };
const compare: string[] = [];

type Tab = 'gallery' | 'compare' | 'results' | 'reference';
const TABS: readonly Tab[] = ['gallery', 'compare', 'results', 'reference'];
const tabFromHash = (): Tab => TABS.find((t) => `#${t}` === location.hash) ?? 'gallery';
let tab: Tab = tabFromHash();

const nameInput = element('reviewer', HTMLInputElement);
const savedWhere = element('saved-where', HTMLElement);
const styleSelect = element('filter-style', HTMLSelectElement);
const featureSelect = element('filter-feature', HTMLSelectElement);
const filterCount = element('filter-count', HTMLElement);
const filters = element('filters', HTMLElement);
const compareCount = element('compare-count', HTMLElement);
const importStatus = element('import-status', HTMLElement);

const viewer = createViewer({
  items,
  byId,
  question: inventory.question,
  imageUrl: (item) => fileUrl(item.image),
  documentUrl: (item) => fileUrl(item.document),
  reviewer: () => reviewer,
  book: () => book,
  save(review) {
    book = saveReview(book, review);
    const kept = store.save(book);
    showSavedWhere();
    render();
    return kept;
  },
});

function showSavedWhere(): void {
  savedWhere.dataset.state = store.persistent ? 'device' : 'memory';
  savedWhere.textContent = store.persistent
    ? 'Saved on this device'
    : 'Not saved: this browser is blocking storage. Ratings last until this tab closes, so export them before you leave.';
}

// Filters ---------------------------------------------------------------------

const pool = (): readonly Item[] => (tab === 'reference' ? reference : reviewable);

function fillSelect(select: HTMLSelectElement, field: 'style' | 'feature', label: string): void {
  const options = categories(pool(), field);
  const chosen = filter[field];
  select.replaceChildren(h('option', { value: ALL }, `All ${label} (${pool().length})`));
  for (const value of options) {
    const n = pool().filter((i) => i[field] === value).length;
    append(select, h('option', { value }, `${value} (${n})`));
  }
  // A choice that this section does not hold goes back to All.
  const keep = options.includes(chosen) ? chosen : ALL;
  filter = { ...filter, [field]: keep };
  select.value = keep;
}

function fillFilters(): void {
  fillSelect(styleSelect, 'style', 'styles');
  fillSelect(featureSelect, 'feature', 'screens and features');
}

styleSelect.addEventListener('change', () => {
  filter = { ...filter, style: styleSelect.value };
  render();
});
featureSelect.addEventListener('change', () => {
  filter = { ...filter, feature: featureSelect.value };
  render();
});

// Cards -----------------------------------------------------------------------

function thumbnail(item: Item): HTMLImageElement {
  return h('img', {
    class: 'thumb',
    src: fileUrl(thumbnailPath(item)),
    alt: '',
    loading: 'lazy',
    decoding: 'async',
  });
}

function tags(item: Item): HTMLElement {
  return h(
    'div',
    { class: 'tags' },
    h(
      'span',
      { class: 'tag kind' },
      item.extractedFrom ? 'Extracted detail' : kindLabel[item.kind],
    ),
    h('span', { class: 'tag' }, item.style),
    h('span', { class: 'tag' }, item.feature),
  );
}

function compareBox(item: Item): HTMLElement {
  const box = h('input', {
    type: 'checkbox',
    checked: compare.includes(item.id),
    disabled: !compare.includes(item.id) && compare.length >= COMPARE_MAX,
    'aria-label': `Compare ${item.title}`,
  });
  box.addEventListener('change', () => {
    const at = compare.indexOf(item.id);
    if (box.checked && at === -1 && compare.length < COMPARE_MAX) compare.push(item.id);
    if (!box.checked && at !== -1) compare.splice(at, 1);
    render();
  });
  return h('label', { class: 'inline' }, box, 'Compare');
}

function card(item: Item): HTMLLIElement {
  const open = h('button', {
    type: 'button',
    class: 'open',
    'aria-label': `Open ${item.title} full size`,
  });
  open.append(thumbnail(item));
  open.addEventListener('click', () => viewer.open(item, open));
  const mine = myReview(book, reviewer, item.id);
  const rated = isReviewable(item)
    ? h(
        'p',
        { class: mine ? '' : 'muted' },
        mine
          ? `Your score: ${mine.score} of ${MAX_SCORE}${mine.favorite ? ' · ★ favorite' : ''}`
          : 'Not rated by you',
      )
    : h('p', { class: 'muted' }, 'Reference, not rated');
  return h(
    'li',
    { class: 'card', 'data-id': item.id },
    open,
    h(
      'div',
      { class: 'body' },
      h('h3', {}, item.title),
      tags(item),
      h('div', { class: 'foot' }, rated, compareBox(item)),
    ),
  );
}

function documentCard(item: Item): HTMLLIElement {
  const href = fileUrl(item.document);
  return h(
    'li',
    { class: 'card', 'data-id': item.id },
    h(
      'div',
      { class: 'body' },
      h('h3', {}, item.title),
      tags(item),
      h('p', { class: 'muted' }, item.notes),
      h('p', {}, h('a', { href, target: '_blank', rel: 'noopener' }, 'Open the PDF')),
    ),
  );
}

function showList(list: HTMLElement, shown: readonly Item[], total: number): void {
  list.replaceChildren(...shown.map((i) => (i.image === null ? documentCard(i) : card(i))));
  if (shown.length === 0) {
    list.append(h('li', { class: 'empty' }, 'Nothing matches these filters.'));
  }
  filterCount.textContent = `Showing ${shown.length} of ${total}`;
}

// Sections --------------------------------------------------------------------

function renderGallery(): void {
  const shown = reviewable.filter((i) => matches(i, filter));
  showList(element('gallery', HTMLUListElement), shown, reviewable.length);
  const mine = reviewable.filter((i) => myReview(book, reviewer, i.id)).length;
  element('progress', HTMLElement).textContent =
    reviewer.trim() === ''
      ? 'Enter your name above to start rating. Click any image to see it full size.'
      : `You have rated ${mine} of ${reviewable.length}. Unrated items are left out of results, not scored as zero.`;
}

function renderCompare(): void {
  const holder = element('compare', HTMLElement);
  holder.dataset.count = String(compare.length);
  holder.replaceChildren();
  if (compare.length === 0) {
    holder.append(
      h('p', { class: 'empty' }, 'Nothing picked yet. Tick Compare on two to four cards.'),
    );
    return;
  }
  for (const id of compare) {
    const item = byId.get(id);
    if (!item) continue;
    const open = h('button', { type: 'button' }, 'Open full size');
    open.addEventListener('click', () => viewer.open(item, open));
    const remove = h('button', { type: 'button' }, 'Remove');
    remove.addEventListener('click', () => {
      compare.splice(compare.indexOf(id), 1);
      render();
    });
    append(
      holder,
      h(
        'figure',
        { 'data-id': id },
        h('img', { src: fileUrl(item.image), alt: item.title, loading: 'lazy', decoding: 'async' }),
        h(
          'figcaption',
          {},
          h('h3', {}, item.title),
          tags(item),
          h('div', { class: 'actions' }, open, remove),
        ),
      ),
    );
  }
}

function distribution(r: Ranked): HTMLElement {
  const max = Math.max(...r.distribution, 1);
  const said = r.distribution
    .map((n, i) => (n > 0 ? `${plural(n, 'reviewer')} gave ${i + 1}` : ''))
    .filter(Boolean)
    .join(', ');
  const chart = h('div', { class: 'dist', role: 'img', 'aria-label': `Scores: ${said}.` });
  r.distribution.forEach((n, i) => {
    const bar = h('div', { class: 'bar', title: `Score ${i + 1}: ${plural(n, 'reviewer')}` });
    bar.style.height = n === 0 ? '0' : `${Math.max(8, (n / max) * 100)}%`;
    append(
      chart,
      h(
        'div',
        { class: 'col', title: `Score ${i + 1}: ${plural(n, 'reviewer')}` },
        h('div', { class: 'well' }, bar),
        h('span', { class: 'tick', 'aria-hidden': 'true' }, i + 1),
      ),
    );
  });
  return chart;
}

function resultRow(r: Ranked): HTMLLIElement {
  const item = byId.get(r.itemId);
  if (!item) return h('li');
  const open = h('button', {
    type: 'button',
    class: 'open',
    'aria-label': `Open ${item.title} full size`,
  });
  open.append(thumbnail(item));
  open.addEventListener('click', () => viewer.open(item, open));
  const mine = myReview(book, reviewer, item.id);
  const comments =
    r.comments.length === 0
      ? h('p', { class: 'muted' }, 'No comments.')
      : h(
          'details',
          {},
          h('summary', {}, plural(r.comments.length, 'comment')),
          h(
            'ul',
            { class: 'comments' },
            ...r.comments.map((c) => h('li', {}, h('b', {}, c.reviewer), c.text)),
          ),
        );
  return h(
    'li',
    { class: 'result', 'data-id': item.id },
    h(
      'div',
      { class: 'rank' },
      r.tied ? `=${r.rank}` : String(r.rank),
      r.tied ? h('small', {}, 'Tied') : null,
    ),
    open,
    h(
      'div',
      { class: 'detail' },
      h('h3', {}, item.title),
      tags(item),
      h(
        'p',
        { class: 'score' },
        h('strong', {}, r.average === null ? 'none' : formatAverage(r.average)),
        ` average · n = ${r.count} ${r.count === 1 ? 'reviewer' : 'reviewers'}`,
      ),
      distribution(r),
      h('p', {}, `Your score: ${mine?.score ?? 'none'} · ★ ${plural(r.favorites, 'favorite')}`),
      comments,
    ),
  );
}

function renderResults(): void {
  const list = element('results', HTMLOListElement);
  const hidden = element('results-hidden', HTMLElement);
  const note = element('results-note', HTMLElement);
  note.textContent = '';
  const reviewers = new Set(book.map((r) => reviewerKey(r.reviewer))).size;
  element('results-scope', HTMLElement).textContent =
    `Saved on this device. Combined here from ${plural(reviewers, 'reviewer')}: ` +
    'you plus any ratings files imported. These are not shared team results.';
  list.replaceChildren();
  hidden.replaceChildren();
  const shown = reviewable.filter((i) => matches(i, filter));
  filterCount.textContent = `Showing ${shown.length} of ${reviewable.length}`;
  if (reviewer.trim() === '') {
    list.append(
      h(
        'li',
        { class: 'empty' },
        'Enter your name above to see results for the items you have rated.',
      ),
    );
    return;
  }
  const seen = shown.filter((i) => canSeeResults(book, reviewer, i.id));
  const unseen = shown.filter((i) => !canSeeResults(book, reviewer, i.id));
  if (seen.length === 0) {
    list.append(
      h('li', { class: 'empty' }, 'Rate an item to see its results. Until then they stay hidden.'),
    );
  } else {
    note.textContent =
      `Ranked among the ${plural(seen.length, 'item')} you have rated. ` +
      'Averages show two decimals; ranks compare them exactly.';
    list.replaceChildren(
      ...rankItems(
        book,
        seen.map((i) => i.id),
      ).map(resultRow),
    );
  }
  if (unseen.length > 0) {
    const buttons = unseen.map((item) => {
      const b = h('button', { type: 'button' }, item.title);
      b.addEventListener('click', () => viewer.open(item, b));
      return b;
    });
    append(
      hidden,
      h(
        'details',
        {},
        h(
          'summary',
          {},
          `Not yet rated by you: ${plural(unseen.length, 'item')}. Their results stay hidden.`,
        ),
        h('div', { class: 'actions' }, ...buttons),
      ),
    );
  }
}

function renderReference(): void {
  const shown = reference.filter((i) => matches(i, filter));
  showList(element('reference', HTMLUListElement), shown, reference.length);
  const start = byId.get('cl-nhr-start-screen');
  element('interactive', HTMLUListElement).replaceChildren(
    h(
      'li',
      { class: 'card' },
      start ? thumbnail(start) : null,
      h(
        'div',
        { class: 'body' },
        h('h3', {}, 'Night Harbor Run, playable'),
        h(
          'p',
          {},
          'The playable arcade prototype, on a private Claude page. Ask Elliott for access. ',
          'It is not rated or ranked here: rate its screenshots in the gallery.',
        ),
        h(
          'p',
          {},
          h(
            'a',
            { href: NIGHT_HARBOR_RUN, target: '_blank', rel: 'noopener' },
            'Open Night Harbor Run',
          ),
        ),
      ),
    ),
  );
  element('unavailable', HTMLUListElement).replaceChildren(
    ...items
      .filter((i) => i.availability === 'unavailable')
      .map((i) =>
        h('li', { 'data-id': i.id }, h('strong', {}, i.style), ` (${i.creator}). ${i.notes}`),
      ),
  );
}

function render(): void {
  for (const t of TABS) {
    element(`tab-${t}`, HTMLElement).hidden = t !== tab;
    const button = document.querySelector(`[data-tab="${t}"]`);
    if (t === tab) button?.setAttribute('aria-current', 'page');
    else button?.removeAttribute('aria-current');
  }
  compareCount.textContent = compare.length > 0 ? `(${compare.length})` : '';
  filters.hidden = tab === 'compare';
  fillFilters();
  if (tab === 'gallery') renderGallery();
  else if (tab === 'compare') renderCompare();
  else if (tab === 'results') renderResults();
  else renderReference();
}

// Wiring ----------------------------------------------------------------------

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-tab]')) {
  button.addEventListener('click', () => {
    location.hash = button.dataset.tab ?? 'gallery';
  });
}
addEventListener('hashchange', () => {
  tab = tabFromHash();
  render();
});

element('compare-clear', HTMLButtonElement).addEventListener('click', () => {
  compare.length = 0;
  render();
});

nameInput.value = reviewer;
nameInput.addEventListener('input', () => {
  reviewer = displayName(nameInput.value);
  store.saveName(reviewer);
});
nameInput.addEventListener('change', () => {
  render();
  viewer.refresh();
});

function download(name: string, file: unknown): void {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }),
  );
  const link = h('a', { href: url, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const myReviewCount = () =>
  reviewer === ''
    ? 0
    : book.filter((r) => reviewerKey(r.reviewer) === reviewerKey(reviewer)).length;

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'all';
const today = () => new Date().toISOString().slice(0, 10);

element('export-mine', HTMLButtonElement).addEventListener('click', () => {
  if (myReviewCount() === 0) {
    importStatus.textContent = 'You have no ratings to export yet.';
    return;
  }
  download(
    `captains-academy-prototype-ratings-${slug(reviewer)}-${today()}.json`,
    exportReviews(book, reviewer, new Date().toISOString()),
  );
  importStatus.textContent = `Exported ${plural(myReviewCount(), 'rating')}. Send the file to Elliott.`;
});
element('export-all', HTMLButtonElement).addEventListener('click', () => {
  download(
    `captains-academy-prototype-ratings-all-${today()}.json`,
    exportReviews(book, undefined, new Date().toISOString()),
  );
  importStatus.textContent = `Exported ${plural(book.length, 'rating')} from this device.`;
});

const importInput = element('import-file', HTMLInputElement);
importInput.addEventListener('change', async () => {
  const file = importInput.files?.[0];
  importInput.value = '';
  if (!file) return;
  try {
    const result = importReviews(book, await file.text(), reviewableIds);
    book = result.book;
    const kept = store.save(book);
    showSavedWhere();
    importStatus.dataset.tone = kept ? '' : 'error';
    importStatus.textContent =
      `Imported ${file.name}: ${result.added} added, ${result.updated} updated, ${result.skipped} skipped ` +
      '(older than what this device has, or for items this gallery does not list).';
    render();
  } catch (error) {
    importStatus.dataset.tone = 'error';
    importStatus.textContent =
      error instanceof NotARatingsFileError ? error.message : 'That file could not be read.';
  }
});

showSavedWhere();
render();
