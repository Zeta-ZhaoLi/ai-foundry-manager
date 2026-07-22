import { describe, expect, it } from 'vitest';
import {
  VaultError,
  createVaultEnvelope,
  decryptVaultEnvelope,
  isVaultEnvelope,
  parseVaultEnvelope,
} from '../vault';

const PASSWORD = 'correct horse battery staple';

describe('Web Crypto vault', () => {
  it('encrypts and decrypts JSON without exposing plaintext', async () => {
    const payload = { apiKey: 'secret-api-key', nested: { value: 42 } };
    const { envelope } = await createVaultEnvelope(
      payload,
      PASSWORD,
      'local-vault'
    );

    expect(isVaultEnvelope(envelope)).toBe(true);
    expect(JSON.stringify(envelope)).not.toContain('secret-api-key');

    const decrypted = await decryptVaultEnvelope<typeof payload>(
      envelope,
      PASSWORD,
      'local-vault'
    );
    expect(decrypted.payload).toEqual(payload);
  });

  it('rejects the wrong password without returning ciphertext as data', async () => {
    const { envelope } = await createVaultEnvelope(
      { password: 'plain-secret' },
      PASSWORD,
      'local-vault'
    );

    await expect(
      decryptVaultEnvelope(
        envelope,
        'this password is definitely wrong',
        'local-vault'
      )
    ).rejects.toMatchObject({ code: 'INVALID_PASSWORD' });
  });

  it('detects ciphertext tampering', async () => {
    const { envelope } = await createVaultEnvelope(
      { apiKey: 'secret' },
      PASSWORD,
      'backup'
    );
    const last = envelope.ciphertext.at(-1);
    const tampered = {
      ...envelope,
      ciphertext: `${envelope.ciphertext.slice(0, -1)}${last === 'A' ? 'B' : 'A'}`,
    };

    await expect(
      decryptVaultEnvelope(tampered, PASSWORD, 'backup')
    ).rejects.toMatchObject({ code: 'INVALID_PASSWORD' });
  });

  it('rejects unsupported envelopes and purpose mismatches', async () => {
    expect(() => parseVaultEnvelope('{"version":1}')).toThrow(VaultError);
    const { envelope } = await createVaultEnvelope(
      { value: true },
      PASSWORD,
      'backup'
    );
    await expect(
      decryptVaultEnvelope(envelope, PASSWORD, 'local-vault')
    ).rejects.toMatchObject({ code: 'INVALID_ENVELOPE' });
  });
});
