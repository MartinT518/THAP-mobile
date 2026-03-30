import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const SALT = "thap-api-key-encryption";

function deriveKey(): Buffer {
  const secret = process.env.JWT_SECRET ?? "";
  if (!secret) throw new Error("JWT_SECRET is required for API key encryption");
  return pbkdf2Sync(secret, SALT, 100_000, 32, "sha256");
}

/**
 * Encrypts a plaintext string. Returns a hex-encoded string: iv + authTag + ciphertext.
 * Returns empty string for empty input.
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return "";
  const key = deriveKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("hex");
}

/**
 * Decrypts a hex-encoded string produced by `encrypt`.
 * Returns empty string for empty input.
 * Returns the input unchanged if it doesn't look like an encrypted value (graceful migration).
 */
export function decrypt(cipherHex: string): string {
  if (!cipherHex) return "";

  const minLength = (IV_LENGTH + AUTH_TAG_LENGTH) * 2;
  if (cipherHex.length < minLength || !/^[0-9a-f]+$/i.test(cipherHex)) {
    return cipherHex;
  }

  try {
    const key = deriveKey();
    const data = Buffer.from(cipherHex, "hex");
    const iv = data.subarray(0, IV_LENGTH);
    const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    return cipherHex;
  }
}
