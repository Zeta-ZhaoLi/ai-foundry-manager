import CryptoJS from 'crypto-js';

// 使用一个固定的密钥派生函数，基于浏览器指纹生成密钥
// 注意：这只是基础的本地加密，不能替代服务端加密
function getDerivedKey(): string {
  // 使用浏览器特征生成一个相对稳定的密钥
  const browserFingerprint = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width + 'x' + screen.height,
  ].join('|');

  return CryptoJS.SHA256(browserFingerprint).toString();
}

/**
 * 加密敏感数据 (如 API Key)
 */
export function encryptData(plainText: string): string {
  if (!plainText) return '';

  try {
    const key = getDerivedKey();
    const encrypted = CryptoJS.AES.encrypt(plainText, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    return plainText; // 降级：加密失败时返回原文
  }
}

/**
 * 解密敏感数据
 */
export function decryptData(cipherText: string): string {
  if (!cipherText) return '';

  try {
    const key = getDerivedKey();
    const decrypted = CryptoJS.AES.decrypt(cipherText, key);
    const plainText = decrypted.toString(CryptoJS.enc.Utf8);
    return plainText || cipherText; // 如果解密失败，返回原文
  } catch (error) {
    console.error('Decryption failed:', error);
    return cipherText; // 降级：解密失败时返回原文
  }
}

/**
 * 检查字符串是否可能是加密数据
 */
export function isEncrypted(text: string): boolean {
  // AES 加密后通常是 Base64 格式，包含 = 或特定字符
  return text.length > 20 && /^[A-Za-z0-9+/=]+$/.test(text);
}
