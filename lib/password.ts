import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 };

async function deriveKey(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password.normalize("NFKC"), salt, KEY_LENGTH, SCRYPT_OPTIONS, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await deriveKey(password, salt);
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, encodedKey, ...extra] = storedHash.split(":");
  if (!salt || !encodedKey || extra.length || !/^[a-f0-9]+$/i.test(encodedKey)) return false;
  const expected = Buffer.from(encodedKey, "hex");
  if (expected.length !== KEY_LENGTH) return false;
  const actual = await deriveKey(password, salt);
  return timingSafeEqual(actual, expected);
}
