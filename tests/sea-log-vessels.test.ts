import { describe, expect, it } from 'vitest';
import {
  missingDetails,
  PROPULSION_KINDS,
  ROLE_CATEGORIES,
  roleSchema,
  vesselSchema,
  type Vessel,
} from '../src/log/entry';
import { ROLES_V2 } from '../src/log/schema';
import { parseAmount, routeOf } from '../src/log/screens';

// Vessels and roles in the sea-time log's domain module (DECISIONS.md A3).
// The store and the screens run against real IndexedDB in e2e/vessels.spec.ts.

const full: Vessel = {
  id: '5d1c6a7e-2b3f-4c8d-9e0a-1b2c3d4e5f60',
  name: 'Sea Breeze',
  officialNumber: '1234567',
  officialGrossTons: 24,
  lengthFeet: 42.5,
  propulsion: 'motor',
  owner: 'Harbor Charters LLC',
  horsepower: 450,
  photo: new Blob(['jpeg bytes'], { type: 'image/jpeg' }),
  defaultRoleId: 'deck.mate',
  updatedAt: '2026-10-21T15:00:00.000Z',
  deletedAt: null,
};

const bare: Vessel = {
  ...full,
  officialNumber: null,
  officialGrossTons: null,
  lengthFeet: null,
  propulsion: null,
  owner: null,
  horsepower: null,
  photo: null,
  defaultRoleId: null,
};

describe('vessel schema', () => {
  it('accepts a full record, and a name alone with every detail left for later', () => {
    expect(vesselSchema.parse(full)).toEqual(full);
    expect(vesselSchema.parse(bare)).toEqual(bare);
  });

  it('needs a name', () => {
    expect(vesselSchema.safeParse({ ...bare, name: '' }).success).toBe(false);
    expect(vesselSchema.safeParse({ ...bare, name: '   ' }).success).toBe(false);
  });

  it('has one tonnage field, the official gross tonnage', () => {
    expect(Object.keys(vesselSchema.shape).filter((key) => /ton/i.test(key))).toEqual([
      'officialGrossTons',
    ]);
  });

  // Strict, so a tonnage figure from anywhere but the documents (open
  // decision D5), credit, or game time can never be stored on a vessel.
  it.each([
    { field: 'estimatedGrossTons', value: 20 },
    { field: 'grossTonsEstimate', value: 20 },
    { field: 'tonnageSource', value: 'calculated' },
    { field: 'creditedDays', value: 1 },
    { field: 'gameMinutes', value: 30 },
    { field: 'simulatorSessionId', value: 'abc' },
  ])('refuses a vessel with an extra $field field', ({ field, value }) => {
    expect(vesselSchema.safeParse({ ...full, [field]: value }).success).toBe(false);
  });

  it.each(['officialGrossTons', 'lengthFeet', 'horsepower'])(
    'refuses a %s of zero, below zero or not a number',
    (key) => {
      for (const value of [0, -3, Number.NaN, Number.POSITIVE_INFINITY, '24']) {
        expect(vesselSchema.safeParse({ ...full, [key]: value }).success).toBe(false);
      }
    },
  );

  it('knows a fixed list of propulsion kinds', () => {
    expect(PROPULSION_KINDS).toEqual([
      'motor',
      'sail',
      'auxiliary-sail',
      'steam',
      'gas-turbine',
      'other',
    ]);
    expect(vesselSchema.safeParse({ ...full, propulsion: 'oars' }).success).toBe(false);
  });

  it('keeps the photo as a picture, not a link to somewhere else', () => {
    expect(vesselSchema.safeParse({ ...full, photo: 'https://example.com/boat.jpg' }).success).toBe(
      false,
    );
  });

  it('refuses bad ids and times, as entries do', () => {
    expect(vesselSchema.safeParse({ ...full, id: 'boat-1' }).success).toBe(false);
    expect(vesselSchema.safeParse({ ...full, deletedAt: 'now' }).success).toBe(false);
  });

  it('lists the details still missing, in form order', () => {
    expect(missingDetails(full)).toEqual([]);
    expect(missingDetails(bare)).toEqual([
      'officialNumber',
      'officialGrossTons',
      'lengthFeet',
      'propulsion',
      'owner',
      'horsepower',
      'photo',
    ]);
    expect(missingDetails({ ...full, owner: null })).toEqual(['owner']);
  });
});

describe('role list', () => {
  it('has deck and engine roles, and only those categories', () => {
    expect(ROLE_CATEGORIES).toEqual(['deck', 'engine']);
    const categories = new Set(ROLES_V2.map((role) => role.category));
    expect([...categories].sort()).toEqual(['deck', 'engine']);
  });

  it('seeds roles that each match the schema, with unique ids and positions', () => {
    for (const role of ROLES_V2) expect(roleSchema.parse(role)).toEqual(role);
    expect(new Set(ROLES_V2.map((role) => role.id)).size).toBe(ROLES_V2.length);
    for (const category of ROLE_CATEGORIES) {
      const positions = ROLES_V2.filter((r) => r.category === category).map((r) => r.position);
      expect(new Set(positions).size).toBe(positions.length);
    }
  });

  // Ids are stable for good: saved vessels and the future rules engine refer
  // to them. Renaming or dropping one needs a new migration, not an edit.
  it('keeps the ids version 2 shipped', () => {
    expect(ROLES_V2.map((role) => role.id)).toEqual([
      'deck.master',
      'deck.mate',
      'deck.pilot',
      'deck.boatswain',
      'deck.able-seaman',
      'deck.ordinary-seaman',
      'deck.deckhand',
      'deck.cadet',
      'engine.chief-engineer',
      'engine.assistant-engineer',
      'engine.electro-technical-officer',
      'engine.qmed',
      'engine.oiler',
      'engine.wiper',
      'engine.cadet',
    ]);
  });

  it("refuses an id that doesn't start with its category", () => {
    const mate = { id: 'deck.mate', label: 'Mate', category: 'deck', position: 1 };
    expect(roleSchema.safeParse({ ...mate, category: 'engine' }).success).toBe(false);
    expect(roleSchema.safeParse({ ...mate, id: 'Mate' }).success).toBe(false);
  });

  // How a role counts toward a license is open decision D4. Until it is
  // settled, a role carries nothing about credit, and the schema refuses it.
  it('carries no credit of any kind', () => {
    for (const role of ROLES_V2) {
      expect(Object.keys(role).sort()).toEqual(['category', 'id', 'label', 'position']);
    }
    const mate = { id: 'deck.mate', label: 'Mate', category: 'deck', position: 1 };
    for (const field of [
      'credit',
      'creditsToward',
      'creditFactor',
      'licenses',
      'countsAsSeaTime',
    ]) {
      expect(roleSchema.safeParse({ ...mate, [field]: 1 }).success).toBe(false);
    }
  });
});

describe('vessel screens', () => {
  it('route by the address after #', () => {
    expect(routeOf('')).toEqual({ screen: 'home' });
    expect(routeOf('#vessels')).toEqual({ screen: 'vessels' });
    expect(routeOf('#vessels/new')).toEqual({ screen: 'vessel', id: null });
    expect(routeOf(`#vessels/${full.id}`)).toEqual({ screen: 'vessel', id: full.id });
    expect(routeOf('#roles')).toEqual({ screen: 'roles' });
    expect(routeOf('#vessels/not-an-id')).toEqual({ screen: 'home' });
    expect(routeOf('#settings')).toEqual({ screen: 'home' });
  });

  it('read a blank amount as not entered, and refuse zero, negatives and words', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('  ')).toBeNull();
    expect(parseAmount('24')).toBe(24);
    expect(parseAmount(' 42.5 ')).toBe(42.5);
    expect(parseAmount('1,200')).toBe(1200);
    for (const text of ['0', '-5', 'about 20', 'NaN', 'Infinity']) {
      expect(parseAmount(text)).toBe('invalid');
    }
  });
});
