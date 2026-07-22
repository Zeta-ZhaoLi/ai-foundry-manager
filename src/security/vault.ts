export const VAULT_FORMAT = 'ai-foundry-manager-vault' as const;
export const VAULT_VERSION = 2 as const;
export const VAULT_STORAGE_KEY = 'ai-foundry-manager:vault:v2';
export const LEGACY_ACCOUNTS_STORAGE_KEY = 'ai-foundry-manager:accounts';
export const LEGACY_ACCOUNTS_STORAGE_KEY_V1 = 'azure-openai-manager:accounts';
export const LEGACY_ACCOUNTS_BACKUP_KEY =
  'ai-foundry-manager:accounts:legacy-backup';
export const MIN_VAULT_PASSWORD_LENGTH = 12;

const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export type VaultPurpose = 'local-vault' | 'backup';
export type VaultStatus =
  | 'unconfigured'
  | 'locked'
  | 'unlocking'
  | 'unlocked'
  | 'error';
export type VaultSaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type VaultErrorCode =
  | 'UNAVAILABLE'
  | 'INVALID_PASSWORD'
  | 'INVALID_ENVELOPE'
  | 'INVALID_PAYLOAD'
  | 'PASSWORD_TOO_SHORT'
  | 'STORAGE_FAILED';

export interface VaultEnvelopeV2 {
  format: typeof VAULT_FORMAT;
  version: typeof VAULT_VERSION;
  purpose: VaultPurpose;
  kdf: {
    name: 'PBKDF2';
    hash: 'SHA-256';
    iterations: number;
    salt: string;
  };
  cipher: {
    name: 'AES-GCM';
    iv: string;
  };
  ciphertext: string;
}

export class VaultError extends Error {
  constructor(
    public readonly code: VaultErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'VaultError';
  }
}

function getCrypto(): Crypto {
  const crypto = globalThis.crypto;
  if (!crypto?.subtle || !crypto.getRandomValues) {
    throw new VaultError(
      'UNAVAILABLE',
      'Web Crypto is not available in this browser'
    );
  }
  return crypto;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch (error) {
    throw new VaultError('INVALID_ENVELOPE', 'Invalid base64 in vault', {
      cause: error,
    });
  }
}

function randomBytes(length: number): Uint8Array {
  return getCrypto().getRandomValues(new Uint8Array(length));
}

function additionalData(purpose: VaultPurpose): Uint8Array {
  return new TextEncoder().encode(`${VAULT_FORMAT}:${VAULT_VERSION}:${purpose}`);
}

export function validateVaultPassword(password: string): void {
  if (password.length < MIN_VAULT_PASSWORD_LENGTH) {
    throw new VaultError(
      'PASSWORD_TOO_SHORT',
      `Password must be at least ${MIN_VAULT_PASSWORD_LENGTH} characters`
    );
  }
}

export function isVaultEnvelope(value: unknown): value is VaultEnvelopeV2 {
  if (!value || typeof value !== 'object') return false;
  const envelope = value as Partial<VaultEnvelopeV2>;
  return Boolean(
    envelope.format === VAULT_FORMAT &&
      envelope.version === VAULT_VERSION &&
      (envelope.purpose === 'local-vault' || envelope.purpose === 'backup') &&
      envelope.kdf?.name === 'PBKDF2' &&
      envelope.kdf.hash === 'SHA-256' &&
      envelope.kdf.iterations === PBKDF2_ITERATIONS &&
      typeof envelope.kdf.salt === 'string' &&
      envelope.cipher?.name === 'AES-GCM' &&
      typeof envelope.cipher.iv === 'string' &&
      typeof envelope.ciphertext === 'string'
  );
}

export function parseVaultEnvelope(value: string | unknown): VaultEnvelopeV2 {
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value) as unknown;
    } catch (error) {
      throw new VaultError('INVALID_ENVELOPE', 'Vault is not valid JSON', {
        cause: error,
      });
    }
  }
  if (!isVaultEnvelope(parsed)) {
    throw new VaultError('INVALID_ENVELOPE', 'Unsupported vault format');
  }
  return parsed;
}

export async function deriveVaultKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  validateVaultPassword(password);
  const crypto = getCrypto();
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: PBKDF2_ITERATIONS,
      salt: toArrayBuffer(salt),
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptWithVaultKey(
  payload: unknown,
  key: CryptoKey,
  salt: Uint8Array,
  purpose: VaultPurpose
): Promise<VaultEnvelopeV2> {
  const crypto = getCrypto();
  const iv = randomBytes(IV_BYTES);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
      additionalData: toArrayBuffer(additionalData(purpose)),
    },
    key,
    toArrayBuffer(plaintext)
  );
  return {
    format: VAULT_FORMAT,
    version: VAULT_VERSION,
    purpose,
    kdf: {
      name: 'PBKDF2',
      hash: 'SHA-256',
      iterations: PBKDF2_ITERATIONS,
      salt: bytesToBase64(salt),
    },
    cipher: { name: 'AES-GCM', iv: bytesToBase64(iv) },
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

export async function createVaultEnvelope(
  payload: unknown,
  password: string,
  purpose: VaultPurpose
): Promise<{ envelope: VaultEnvelopeV2; key: CryptoKey }> {
  const salt = randomBytes(SALT_BYTES);
  const key = await deriveVaultKey(password, salt);
  return {
    envelope: await encryptWithVaultKey(payload, key, salt, purpose),
    key,
  };
}

export async function decryptVaultEnvelope<T = unknown>(
  value: string | unknown,
  password: string,
  expectedPurpose?: VaultPurpose
): Promise<{ payload: T; key: CryptoKey; envelope: VaultEnvelopeV2 }> {
  const envelope = parseVaultEnvelope(value);
  if (expectedPurpose && envelope.purpose !== expectedPurpose) {
    throw new VaultError('INVALID_ENVELOPE', 'Unexpected vault purpose');
  }
  const salt = base64ToBytes(envelope.kdf.salt);
  const iv = base64ToBytes(envelope.cipher.iv);
  const ciphertext = base64ToBytes(envelope.ciphertext);
  const key = await deriveVaultKey(password, salt);
  try {
    const plaintext = await getCrypto().subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: toArrayBuffer(iv),
        additionalData: toArrayBuffer(additionalData(envelope.purpose)),
      },
      key,
      toArrayBuffer(ciphertext)
    );
    const payload = JSON.parse(new TextDecoder().decode(plaintext)) as T;
    return { payload, key, envelope };
  } catch (error) {
    throw new VaultError(
      'INVALID_PASSWORD',
      'The password is incorrect or the vault has been modified',
      { cause: error }
    );
  }
}

export function getVaultSalt(envelope: VaultEnvelopeV2): Uint8Array {
  return base64ToBytes(envelope.kdf.salt);
}
