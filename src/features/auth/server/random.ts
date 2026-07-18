// Ported from lucia v2's generateRandomString (lucia/dist/utils/crypto.js). lucia's signature takes
// an optional `alphabet` param, but every call site — lucia's own (salt / user id / session id) and
// ours — uses this default 36-char alphabet, so it is inlined instead of kept as an unused param.
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz1234567890';

/** lucia v2 compatible random string (used for salts, user ids, and session ids). */
export const generateRandomString = (length: number): string => {
  const randomUint32Values = new Uint32Array(length);
  crypto.getRandomValues(randomUint32Values);
  const u32Max = 0xffffffff;
  let result = '';

  // bound the loop by the array length (lucia's exact condition), not the raw `length` argument
  for (let i = 0; i < randomUint32Values.length; i++) {
    const rand = randomUint32Values[i] / (u32Max + 1);
    result += ALPHABET[Math.floor(ALPHABET.length * rand)];
  }

  return result;
};
