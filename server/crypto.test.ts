import { beforeAll, describe, expect, it } from "vitest";
import { encrypt, decrypt } from "./_core/crypto";

beforeAll(() => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-for-vitest";
});

describe("API Key Encryption", () => {
  it("should encrypt and decrypt a key correctly", () => {
    const plaintext = "sk-test-key-abc123";
    const encrypted = encrypt(plaintext);

    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.length).toBeGreaterThan(0);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertexts for same input (random IV)", () => {
    const plaintext = "sk-repeated-key";
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);

    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe(plaintext);
    expect(decrypt(b)).toBe(plaintext);
  });

  it("should handle empty string gracefully", () => {
    expect(encrypt("")).toBe("");
    expect(decrypt("")).toBe("");
  });

  it("should return plaintext unchanged if not a valid encrypted value", () => {
    const plainKey = "sk-not-encrypted-yet";
    const result = decrypt(plainKey);
    expect(result).toBe(plainKey);
  });

  it("should handle various plaintext API key formats", () => {
    const keys = [
      "sk-1234567890abcdef",
      "AIzaSyBexamplekey123",
      "pplx-abc123xyz",
      "a",
      "x".repeat(500),
    ];

    for (const key of keys) {
      const encrypted = encrypt(key);
      expect(decrypt(encrypted)).toBe(key);
    }
  });
});
