import { scrypt, timingSafeEqual, type BinaryLike, type ScryptOptions } from 'node:crypto';
import { promisify } from 'node:util';

import { generateRandomString } from './random';

// Explicit type args select scrypt's options overload; a bare promisify(scrypt) resolves to the
// 3-arg signature and rejects the maxmem options object.
const scryptAsync = promisify<BinaryLike, BinaryLike, number, ScryptOptions, Buffer>(scrypt);

// lucia v2 compatible parameters. 128 * N * r = 32MiB hits the default maxmem, so raise it to 64MiB.
const SCRYPT_OPTIONS = { N: 16384, r: 16, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const HASH_VERSION = 's2';

/** Generates a lucia v2 compatible password hash: `s2:{salt}:{hash}`. */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = generateRandomString(SALT_LENGTH);
  const hash = await computeHash(password, salt);

  return `${HASH_VERSION}:${salt}:${hash}`;
};

/** Verifies a password against a stored hash. Unknown formats (v1 two-part, bcrypt $2a) return false. */
export const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  const parts = storedHash.split(':');

  if (parts.length !== 3 || parts[0] !== HASH_VERSION) {
    return false;
  }

  const [, salt, expectedHash] = parts;
  const actualHash = await computeHash(password, salt);
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  const actualBuffer = Buffer.from(actualHash, 'hex');

  // timingSafeEqual throws on length mismatch, so check length first
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
};

const computeHash = async (password: string, salt: string): Promise<string> => {
  // NFKC-normalize so visually identical unicode inputs hash identically (lucia v2 behavior)
  const derivedKey = await scryptAsync(
    password.normalize('NFKC'),
    salt,
    KEY_LENGTH,
    SCRYPT_OPTIONS,
  );

  return derivedKey.toString('hex');
};
