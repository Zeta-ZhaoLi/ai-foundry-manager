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
 * Decode the CryptoJS format used by older localStorage versions. New data
 * must remain plaintext and must not call this helper unless it has the
 * legacy OpenSSL prefix.
 */
export function decryptLegacyData(value: string): string {
  if (!value || !isLegacyEncrypted(value)) return value;
  try {
    const decrypted = CryptoJS.AES.decrypt(value, getLegacyDerivedKey());
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    return plaintext || value;
  } catch {
    return value;
  }
}

/** Only used to create legacy migration fixtures; never use for persistence. */
export function encryptLegacyData(plainText: string): string {
  if (!plainText) return '';
  return CryptoJS.AES.encrypt(plainText, getLegacyDerivedKey()).toString();
}
