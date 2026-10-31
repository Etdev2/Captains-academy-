import * as React from 'react';
import {
  categories,
  categoryMeta,
  climbedFromLabel,
  conceptId,
  DESK_PATH,
  deskHref,
  isCategory,
  isVariant,
  liveHref,
  parseClimb,
  variantMeta,
  variants,
} from './shared/routes';
import { DEMO_NOTICE } from './shared/sample';
import type {
  CategoryId,
  CategoryVariants,
  ClimbModule,
  VariantId,
  VariantProps,
} from './shared/types';

// The frame around every interactive prototype (lead-owned): which category,
// the A/B/C switcher, a link back to the Decision Desk to rate it, and the
// demo-data notice. The variant inside owns its own layout and palette.
//
// `frame=0` hides the frame, for the screenshots on the Decision Desk.

const loaders: Record<CategoryId, () => Promise<{ default: CategoryVariants }>> = {
  console: () => import('./console'),
  license: () => import('./license'),
  'sea-time': () => import('./sea-time'),
  study: () => import('./study'),
  arcade: () => import('./arcade'),
};

const lazyCategories = Object.fromEntries(
  Object.entries(loaders).map(([id, load]) => [
    id,
    // Each category is its own chunk, so one builder's error never breaks another's page.
    React.lazy(async () => {
      const mod = await load();
      function Category({ variant }: { variant: VariantId }) {
        const Variant = mod.default[variant];
        return <Variant variant={variant} />;
      }
      return { default: Category };
    }),
  ]),
) as Record<CategoryId, React.LazyExoticComponent<React.ComponentType<{ variant: VariantId }>>>;

// Climbed variants, found by folder: <category>/climbs/<variant>-<n>/index.tsx.
// Each is its own chunk, loaded only when a URL names it with `climb=<n>`.
const lazyClimbs: Record<
  string,
  React.LazyExoticComponent<React.ComponentType<VariantProps>>
> = Object.fromEntries(
  Object.entries(import.meta.glob<ClimbModule>('./*/climbs/*/index.tsx')).map(([path, load]) => [
    path,
    React.lazy(load),
  ]),
);

const climbPath = (category: CategoryId, variant: VariantId, climb: number) =>
  `./${category}/climbs/${variant}-${climb}/index.tsx`;

function MissingClimb({ climb }: { climb: number }): React.ReactNode {
  throw new Error(`There is no climb ${climb} of this variant.`);
}

class Boundary extends React.Component<
  { children: React.ReactNode; label: string },
  { error: Error | null }
> {
  override state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  override render() {
    if (this.state.error) {
      return (
        <div className="live-error" role="alert">
          <h1>{this.props.label} could not open.</h1>
          <p>{this.state.error.message}</p>
          <p>
            <a href={DESK_PATH}>Back to the Decision Desk</a>
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function readUrl() {
  const q = new URLSearchParams(window.location.search);
  const category = q.get('category');
  const variant = q.get('variant');
  return {
    category: isCategory(category) ? category : null,
    variant: isVariant(variant) ? variant : 'a',
    climb: parseClimb(q.get('climb')),
    frame: q.get('frame') !== '0',
  };
}

function Frame({
  category,
  variant,
  climb,
}: {
  category: CategoryId;
  variant: VariantId;
  climb: number | undefined;
}) {
  const meta = categoryMeta(category);
  return (
    <section className="live-frame" aria-label="Prototype controls">
      <div className="live-frame-row">
        <a
          className="live-back"
          href={`${DESK_PATH}?concept=${conceptId(category, variant, 'desktop', climb)}`}
        >
          <span aria-hidden>←</span> Decision Desk
        </a>
        <label className="live-cat">
          <span className="sr-only">Category</span>
          <select
            value={category}
            onChange={(e) => {
              window.location.href = liveHref(e.target.value as CategoryId, variant);
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.short}
              </option>
            ))}
          </select>
        </label>
        <span className="live-demo" title={DEMO_NOTICE}>
          <span className="live-demo-long">Prototype · </span>sample data
        </span>
      </div>
      <nav className="live-switch" aria-label={`${meta.title} design variants`}>
        {variants.map((v) => (
          <a
            key={v.id}
            href={liveHref(category, v.id)}
            aria-current={v.id === variant && climb === undefined ? 'page' : undefined}
            title={v.summary}
          >
            <b>{v.letter}</b>
            <span>{v.name}</span>
          </a>
        ))}
        <a className="live-rate" href={deskHref(category, variant, climb)}>
          Rate {variantMeta(variant).letter}
          {climb !== undefined && ` climb ${climb}`}
        </a>
      </nav>
      {climb !== undefined && (
        <p className="live-climb">
          Climb {climb}, {climbedFromLabel(variant)}
        </p>
      )}
    </section>
  );
}

function Index() {
  return (
    <main className="live-index">
      <p className="live-eyebrow">Captain&rsquo;s Academy · design review</p>
      <h1>Interactive prototypes</h1>
      <p className="live-lede">
        Five parts of the app, each in three directions. Every variant shows the same fictional
        sailor, Jordan Sample, so the comparison is fair. {DEMO_NOTICE}
      </p>
      <p>
        <a className="live-desk-link" href={DESK_PATH}>
          Rate and discuss them on the Decision Desk
        </a>
      </p>
      <ul className="live-cards">
        {categories.map((c) => (
          <li key={c.id} id={`category-${c.id}`}>
            <h2>{c.title}</h2>
            <p>{c.summary}</p>
            <ul className="live-variant-links" aria-label={`${c.title} variants`}>
              {variants.map((v) => (
                <li key={v.id}>
                  <a href={liveHref(c.id, v.id)}>
                    <b>{v.letter}</b> {v.name}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </main>
  );
}

function setDocumentTitle(title: string) {
  document.title = title;
}

export function Shell() {
  const { category, variant, climb, frame } = readUrl();
  const climbText = climb === undefined ? '' : ` climb ${climb}`;
  const title = category
    ? `${categoryMeta(category).title} · ${variantMeta(variant).letter}${climbText} ${variantMeta(variant).name} · Prototype`
    : "Interactive prototypes · Captain's Academy";
  React.useEffect(() => setDocumentTitle(title), [title]);
  if (!category) return <Index />;
  const label = `${categoryMeta(category).title}, variant ${variantMeta(variant).letter}${climbText}`;
  const Category = lazyCategories[category];
  const Climbed = climb === undefined ? undefined : lazyClimbs[climbPath(category, variant, climb)];
  return (
    <div className="live-page" data-frame={frame ? 'on' : 'off'}>
      {frame && <Frame category={category} variant={variant} climb={climb} />}
      <div id="variant-root" data-category={category} data-variant={variant} data-climb={climb}>
        <Boundary label={label}>
          <React.Suspense fallback={<p className="live-loading">Loading {label}…</p>}>
            {climb === undefined ? (
              <Category variant={variant} />
            ) : Climbed ? (
              <Climbed variant={variant} climb={climb} />
            ) : (
              <MissingClimb climb={climb} />
            )}
          </React.Suspense>
        </Boundary>
      </div>
    </div>
  );
}
