import { describe, it, expect } from 'vitest';
import { encryptData, decryptData } from '../encryption';

describe('Encryption Utils', () => {
  it('should encrypt and decrypt data correctly', () => {
    const original = 'test-api-key-12345';
    const encrypted = encryptData(original);
    const decrypted = decryptData(encrypted);

    expect(encrypted).not.toBe(original);
    expect(decrypted).toBe(original);
  });

  it('should handle empty strings', () => {
    expect(encryptData('')).toBe('');
    expect(decryptData('')).toBe('');
  });

  it('should return original on decryption failure', () => {
    const invalid = 'invalid-encrypted-data';
    const result = decryptData(invalid);
    expect(result).toBe(invalid);
  });
});
