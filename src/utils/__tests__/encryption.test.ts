import { describe, it, expect } from 'vitest';
import {
  decryptLegacyData,
  encryptLegacyData,
  isLegacyEncrypted,
} from '../encryption';

describe('legacy encryption compatibility', () => {
  it('recognizes and decodes the old CryptoJS format', () => {
    const original = 'test-api-key-12345';
    const encrypted = encryptLegacyData(original);

    expect(isLegacyEncrypted(encrypted)).toBe(true);
    expect(decryptLegacyData(encrypted)).toBe(original);
  });

  it('leaves plaintext and empty values unchanged', () => {
    expect(isLegacyEncrypted('plain-api-key')).toBe(false);
    expect(decryptLegacyData('plain-api-key')).toBe('plain-api-key');
    expect(decryptLegacyData('')).toBe('');
  });

  it('preserves malformed legacy ciphertext when it cannot be decoded', () => {
    const invalid = 'U2FsdGVkX1-invalid-encrypted-data';
    expect(decryptLegacyData(invalid)).toBe(invalid);
  });
});
