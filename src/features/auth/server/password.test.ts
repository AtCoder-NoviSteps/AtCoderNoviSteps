import { describe, test, expect } from 'vitest';

import { hashPassword, verifyPassword } from './password';

// Fixtures generated with lucia v2 (`generateLuciaPasswordHash` from 'lucia/utils') before removing
// lucia, so these hashes are the compatibility anchor. Regenerate with:
//   import { generateLuciaPasswordHash } from 'lucia/utils';
//   for (const p of ['Ch0kuda1', 'AtC0derN0viSteps', 'Ｃｈ０ｋｕｄａ１']) console.log(await generateLuciaPasswordHash(p));
//
// - 'Ch0kuda1': the seed password (authSchema-compliant, prod-compatible anchor)
// - 'AtC0derN0viSteps': a second compliant password (rules out an accidental single match)
// - 'Ｃｈ０ｋｕｄａ１': out of the app input domain (authSchema is ASCII-only); NFKC-normalizes to
//   'Ch0kuda1', so verifying it with the half-width input proves the normalize step exists.
const LUCIA_FIXTURES = {
  ascii1: {
    password: 'Ch0kuda1',
    hash: 's2:idsv8a6pec9boqr1:05e7bdf0828585f6a8ffbcfe04837524993eaa22df5c769df0388dd4c4d9f71bad9b51452167f22d5d17cea4595cae0d01528b01ca2a4b3c48cbad5668b9671d',
  },
  ascii2: {
    password: 'AtC0derN0viSteps',
    hash: 's2:jky3g008bt42uobf:f1ad5f5fa1920891f5812d578b5db26da43c0258433df37edd144e53383b71a60ed3cd43f0c87e55035d116bdc575ce38fec96127ebf030afbb02179acbba0af',
  },
  fullWidth: {
    password: 'Ｃｈ０ｋｕｄａ１',
    hash: 's2:pxgjkm74zjfu1am5:e87a0132275c95eaee49b8f4ef6806d177877a557e1b2a1c074fb34531951a8b8db6a3ac7c212e02b6caa4737c9d7b4b93ce48e4d57c4bb7dbc34fb09d51c20f',
  },
} as const;

describe('hashPassword', () => {
  test('produces the s2:{16-char salt}:{128-char hex} format', async () => {
    const hash = await hashPassword('Ch0kuda1');
    expect(hash).toMatch(/^s2:[a-z0-9]{16}:[0-9a-f]{128}$/);
  });

  test('round-trips: a freshly hashed password verifies against its own hash', async () => {
    const hash = await hashPassword('AtC0derN0viSteps');
    expect(await verifyPassword('AtC0derN0viSteps', hash)).toBe(true);
  });

  test('uses a random salt so the same password hashes to different values', async () => {
    const first = await hashPassword('Ch0kuda1');
    const second = await hashPassword('Ch0kuda1');
    expect(first).not.toBe(second);
  });
});

describe('verifyPassword', () => {
  describe('lucia v2 compatibility (byte-for-byte)', () => {
    test('accepts the seed password against its lucia-generated hash', async () => {
      expect(await verifyPassword(LUCIA_FIXTURES.ascii1.password, LUCIA_FIXTURES.ascii1.hash)).toBe(
        true,
      );
    });

    test('accepts a second compliant password against its lucia-generated hash', async () => {
      expect(await verifyPassword(LUCIA_FIXTURES.ascii2.password, LUCIA_FIXTURES.ascii2.hash)).toBe(
        true,
      );
    });
  });

  describe('NFKC normalization guard (out of app input domain)', () => {
    test('accepts the full-width input against its own hash', async () => {
      expect(
        await verifyPassword(LUCIA_FIXTURES.fullWidth.password, LUCIA_FIXTURES.fullWidth.hash),
      ).toBe(true);
    });

    test('accepts the half-width input against the full-width hash (normalize exists)', async () => {
      expect(await verifyPassword('Ch0kuda1', LUCIA_FIXTURES.fullWidth.hash)).toBe(true);
    });

    test('accepts the full-width input against the half-width hash (normalize is symmetric)', async () => {
      expect(await verifyPassword('Ｃｈ０ｋｕｄａ１', LUCIA_FIXTURES.ascii1.hash)).toBe(true);
    });
  });

  describe('returns false without throwing', () => {
    test('wrong password against a valid hash', async () => {
      expect(await verifyPassword('wrongPassword1', LUCIA_FIXTURES.ascii1.hash)).toBe(false);
    });

    test('legacy two-part {salt}:{hash} format (lucia v1)', async () => {
      const [, salt, hash] = LUCIA_FIXTURES.ascii1.hash.split(':');
      expect(await verifyPassword('Ch0kuda1', `${salt}:${hash}`)).toBe(false);
    });

    test('bcrypt $2a$ format', async () => {
      expect(
        await verifyPassword(
          'Ch0kuda1',
          '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        ),
      ).toBe(false);
    });

    test('empty stored hash', async () => {
      expect(await verifyPassword('Ch0kuda1', '')).toBe(false);
    });

    test('malformed hash with too few parts (s2:saltonly)', async () => {
      expect(await verifyPassword('Ch0kuda1', 's2:saltonly')).toBe(false);
    });

    test('empty password against a valid hash', async () => {
      expect(await verifyPassword('', LUCIA_FIXTURES.ascii1.hash)).toBe(false);
    });
  });
});
