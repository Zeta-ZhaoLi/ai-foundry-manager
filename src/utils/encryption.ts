import CryptoJS from 'crypto-js';

function getDerivedKey(): string {
  const browserFingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width + 'x' + screen.height,
  ].join('|');
  return CryptoJS.SHA256(browserFingerprint).toString();
}

export function encryptData(plainText: string): string {
  if (!plainText) return '';
  try {
    return CryptoJS.AES.encrypt(plainText, getDerivedKey()).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return plainText;
  }
}

export function decryptData(cipherText: string): string {
  if (!cipherText) return '';
  try {
    const decrypted = CryptoJS.AES.decrypt(cipherText, getDerivedKey());
    return decrypted.toString(CryptoJS.enc.Utf8) || cipherText;
  } catch (error) {
    console.error('Decryption failed:', error);
    return cipherText;
  }
}

export function isEncrypted(text: string): boolean {
  return text.length > 20 && /^[A-Za-z0-9+/=]+$/.test(text);
}
