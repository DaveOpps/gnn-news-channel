import crypto from "crypto";

/**
 * Password hashing for editor accounts. Kept in its own module so `seed.ts`,
 * `store.ts` and `auth.ts` can all use it without importing each other.
 *
 * Format: "<salt-hex>:<scrypt-hash-hex>".
 */

const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = (stored ?? "").split(":");
  if (!salt || !hash) return false;
  let expected: Buffer;
  try {
    expected = Buffer.from(hash, "hex");
  } catch {
    return false;
  }
  if (expected.length !== KEY_LEN) return false;
  const candidate = crypto.scryptSync(password, salt, KEY_LEN);
  return crypto.timingSafeEqual(candidate, expected);
}
