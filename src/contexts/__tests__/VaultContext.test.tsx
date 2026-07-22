import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VaultProvider, useVault } from '../VaultContext';
import { createInitialConfigData } from '../../persistence/config';
import { VAULT_STORAGE_KEY, decryptVaultEnvelope } from '../../security/vault';
import type { ConfigDataV2 } from '../../schemas/account';

const PASSWORD = 'correct horse battery staple';
const NEW_PASSWORD = 'a newer correct horse password';

const wrapper = ({ children }: PropsWithChildren) => (
  <VaultProvider>{children}</VaultProvider>
);

class ControlledStorage implements Storage {
  readonly values = new Map<string, string>();
  failWrites = false;

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    if (this.failWrites) {
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
    }
    this.values.set(key, value);
  }
}

function delayNextEncryption(): {
  release: () => void;
  restore: () => void;
} {
  const originalEncrypt = crypto.subtle.encrypt.bind(crypto.subtle);
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const spy = vi.spyOn(crypto.subtle, 'encrypt');
  spy.mockImplementationOnce(((
    algorithm: AlgorithmIdentifier,
    key: CryptoKey,
    data: BufferSource
  ) =>
    gate.then(() =>
      originalEncrypt(algorithm, key, data)
    )) as SubtleCrypto['encrypt']);
  return { release, restore: () => spy.mockRestore() };
}

describe('VaultProvider persistence', () => {
  beforeEach(() => localStorage.clear());

  it('persists encrypted data and unlocks it after remount', async () => {
    const initial = createInitialConfigData();
    initial.accounts[0].regions[0].apiKey = 'plain-api-secret';
    const first = renderHook(() => useVault(), { wrapper });

    await act(async () => {
      await first.result.current.setup(PASSWORD, initial);
    });
    const raw = localStorage.getItem(VAULT_STORAGE_KEY) || '';
    expect(raw).not.toContain('plain-api-secret');
    expect(first.result.current.status).toBe('unlocked');
    first.unmount();

    const second = renderHook(() => useVault(), { wrapper });
    expect(second.result.current.status).toBe('locked');
    let unlockError: unknown;
    await act(async () => {
      try {
        await second.result.current.unlock('the wrong password value');
      } catch (error) {
        unlockError = error;
      }
    });
    expect(unlockError).toBeInstanceOf(Error);
    expect(second.result.current.data).toBeNull();

    await act(async () => {
      await second.result.current.unlock(PASSWORD);
    });
    expect(second.result.current.data?.accounts[0].regions[0].apiKey).toBe(
      'plain-api-secret'
    );
  });

  it('changes the password and rejects the previous password', async () => {
    const first = renderHook(() => useVault(), { wrapper });
    await act(async () => {
      await first.result.current.setup(PASSWORD, createInitialConfigData());
    });
    await act(async () => {
      await first.result.current.changePassword(PASSWORD, NEW_PASSWORD);
    });
    first.unmount();

    const second = renderHook(() => useVault(), { wrapper });
    let unlockError: unknown;
    await act(async () => {
      try {
        await second.result.current.unlock(PASSWORD);
      } catch (error) {
        unlockError = error;
      }
    });
    expect(unlockError).toBeInstanceOf(Error);
    await act(async () => {
      await second.result.current.unlock(NEW_PASSWORD);
    });
    expect(second.result.current.status).toBe('unlocked');
  });

  it('locks immediately and removes decrypted data from memory state', async () => {
    const hook = renderHook(() => useVault(), { wrapper });
    await act(async () => {
      await hook.result.current.setup(PASSWORD, createInitialConfigData());
    });

    act(() => hook.result.current.lock());

    expect(hook.result.current.status).toBe('locked');
    expect(hook.result.current.data).toBeNull();
    expect(hook.result.current.saveStatus).toBe('idle');
  });

  it('keeps only the latest rapid update in storage', async () => {
    const hook = renderHook(() => useVault(), { wrapper });
    await act(async () => {
      await hook.result.current.setup(PASSWORD, createInitialConfigData());
    });

    act(() => {
      hook.result.current.updateData((current) => ({
        ...current,
        masterText: 'older value',
      }));
      hook.result.current.updateData((current) => ({
        ...current,
        masterText: 'latest value',
      }));
    });
    await waitFor(() => expect(hook.result.current.saveStatus).toBe('saved'));

    const raw = localStorage.getItem(VAULT_STORAGE_KEY) || '';
    const decrypted = await decryptVaultEnvelope<ConfigDataV2>(
      raw,
      PASSWORD,
      'local-vault'
    );
    expect(decrypted.payload.masterText).toBe('latest value');
  });

  it('does not let an old-key save overwrite a password change', async () => {
    const first = renderHook(() => useVault(), { wrapper });
    await act(async () => {
      await first.result.current.setup(PASSWORD, createInitialConfigData());
    });

    const delayed = delayNextEncryption();
    act(() => {
      first.result.current.updateData((current) => ({
        ...current,
        masterText: 'saved with the new password',
      }));
    });
    await waitFor(() => expect(first.result.current.saveStatus).toBe('saving'));

    await act(async () => {
      await first.result.current.changePassword(PASSWORD, NEW_PASSWORD);
    });
    delayed.release();
    await act(async () => Promise.resolve());
    delayed.restore();
    first.unmount();

    const second = renderHook(() => useVault(), { wrapper });
    await expect(
      act(async () => second.result.current.unlock(PASSWORD))
    ).rejects.toThrow();
    await act(async () => {
      await second.result.current.unlock(NEW_PASSWORD);
    });
    expect(second.result.current.data?.masterText).toBe(
      'saved with the new password'
    );
  });

  it('reports storage quota failures without writing plaintext', async () => {
    const storage = new ControlledStorage();
    const storageWrapper = ({ children }: PropsWithChildren) => (
      <VaultProvider storage={storage}>{children}</VaultProvider>
    );
    const hook = renderHook(() => useVault(), { wrapper: storageWrapper });
    await act(async () => {
      await hook.result.current.setup(PASSWORD, createInitialConfigData());
    });
    const previousRaw = storage.getItem(VAULT_STORAGE_KEY);
    storage.failWrites = true;

    act(() => {
      hook.result.current.updateData((current) => ({
        ...current,
        masterText: 'must never be plaintext',
      }));
    });
    await waitFor(() => expect(hook.result.current.saveStatus).toBe('error'));

    expect(storage.getItem(VAULT_STORAGE_KEY)).toBe(previousRaw);
    expect(storage.getItem(VAULT_STORAGE_KEY)).not.toContain(
      'must never be plaintext'
    );
  });

  it('prevents page unload while an encrypted save is pending', async () => {
    const hook = renderHook(() => useVault(), { wrapper });
    await act(async () => {
      await hook.result.current.setup(PASSWORD, createInitialConfigData());
    });
    const delayed = delayNextEncryption();

    act(() => {
      hook.result.current.updateData((current) => ({
        ...current,
        masterText: 'pending save',
      }));
    });
    await waitFor(() => expect(hook.result.current.saveStatus).toBe('saving'));

    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);

    delayed.release();
    await waitFor(() => expect(hook.result.current.saveStatus).toBe('saved'));
    delayed.restore();
  });
});
