import * as React from 'react';
import {
  categories,
  categoryMeta,
  conceptId,
  DESK_PATH,
  deskHref,
  isCategory,
  isVariant,
  liveHref,
  variantMeta,
  variants,
} from './shared/routes';
import { DEMO_NOTICE } from './shared/sample';
import type { CategoryId, CategoryVariants, VariantId } from './shared/types';

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
    frame: q.get('frame') !== '0',
  };
}

function Frame({ category, variant }: { category: CategoryId; variant: VariantId }) {
  const meta = categoryMeta(category);
  return (
    <header className="live-frame" aria-label="Prototype controls">
      <div className="live-frame-row">
        <a className="live-back" href={`${DESK_PATH}?concept=${conceptId(category, variant)}`}>
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
            aria-current={v.id === variant ? 'page' : undefined}
            title={v.summary}
          >
            <b>{v.letter}</b>
            <span>{v.name}</span>
          </a>
        ))}
        <a className="live-rate" href={deskHref(category, variant)}>
          Rate {variantMeta(variant).letter}
        </a>
      </nav>
    </header>
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

export function Shell() {
  const { category, variant, frame } = readUrl();
  React.useEffect(() => {
    document.title = category
      ? `${categoryMeta(category).title} · ${variantMeta(variant).letter} ${variantMeta(variant).name} · Prototype`
      : "Interactive prototypes · Captain's Academy";
  }, [category, variant]);
  if (!category) return <Index />;
  const Category = lazyCategories[category];
  const label = `${categoryMeta(category).title}, variant ${variantMeta(variant).letter}`;
  return (
    <div className="live-page" data-frame={frame ? 'on' : 'off'}>
      {frame && <Frame category={category} variant={variant} />}
      <div id="variant-root" data-category={category} data-variant={variant}>
        <Boundary label={label}>
          <React.Suspense fallback={<p className="live-loading">Loading {label}…</p>}>
            <Category variant={variant} />
          </React.Suspense>
        </Boundary>
      </div>
    </div>
  );
}
