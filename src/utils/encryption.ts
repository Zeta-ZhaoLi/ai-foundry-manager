import CryptoJS from 'crypto-js';

const LEGACY_OPENSSL_PREFIX = 'U2FsdGVkX1';

function getLegacyDerivedKey(): string {
  const browserFingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width + 'x' + screen.height,
  ].join('|');
  return CryptoJS.SHA256(browserFingerprint).toString();
}

export function isLegacyEncrypted(text: string): boolean {
  return text.startsWith(LEGACY_OPENSSL_PREFIX);
}

/**
 * Read the pre-vault CryptoJS format during migration. Plaintext legacy
 * exports remain supported, but malformed ciphertext never falls back to
 * being treated as a usable secret.
 */
export function decryptLegacyData(value: string): string {
  if (!value || !isLegacyEncrypted(value)) return value;
  const decrypted = CryptoJS.AES.decrypt(value, getLegacyDerivedKey());
  const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
  if (!plaintext) {
    throw new Error('Legacy secret cannot be decrypted in this browser');
  }
  return plaintext;
}

/** @deprecated Only retained to create fixtures for the legacy migration. */
export function encryptData(plainText: string): string {
  if (!plainText) return '';
  return CryptoJS.AES.encrypt(plainText, getLegacyDerivedKey()).toString();
}

/** @deprecated Use the V2 Web Crypto vault for all new persistence. */
export function decryptData(cipherText: string): string {
  return decryptLegacyData(cipherText);
}

/** @deprecated Use isLegacyEncrypted for legacy migration checks. */
export function isEncrypted(text: string): boolean {
  return isLegacyEncrypted(text);
}
