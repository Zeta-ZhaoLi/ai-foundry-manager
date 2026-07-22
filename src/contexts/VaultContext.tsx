import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ConfigDataV2 } from '../schemas/account';
import { parseConfigData, finishLegacyMigration } from '../persistence/config';
import {
  VAULT_STORAGE_KEY,
  VaultError,
  createVaultEnvelope,
  decryptVaultEnvelope,
  encryptWithVaultKey,
  getVaultSalt,
  parseVaultEnvelope,
  type VaultEnvelopeV2,
  type VaultSaveStatus,
  type VaultStatus,
} from '../security/vault';

export interface VaultContextValue {
  status: VaultStatus;
  saveStatus: VaultSaveStatus;
  data: ConfigDataV2 | null;
  error: string | null;
  recoveryRaw: string | null;
  setup: (
    password: string,
    data: ConfigDataV2,
    migrateLegacy?: boolean
  ) => Promise<void>;
  unlock: (password: string) => Promise<void>;
  lock: () => void;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  updateData: (updater: (current: ConfigDataV2) => ConfigDataV2) => void;
  replaceData: (data: ConfigDataV2) => void;
  resetVault: () => void;
}

interface VaultProviderProps {
  children: React.ReactNode;
  initialData?: ConfigDataV2;
  storage?: Storage;
}

const VaultContext = createContext<VaultContextValue | null>(null);

function readInitialVault(storage: Storage): {
  status: VaultStatus;
  envelope: VaultEnvelopeV2 | null;
  recoveryRaw: string | null;
  error: string | null;
} {
  const raw = storage.getItem(VAULT_STORAGE_KEY);
  if (!raw) {
    return {
      status: 'unconfigured',
      envelope: null,
      recoveryRaw: null,
      error: null,
    };
  }
  try {
    return {
      status: 'locked',
      envelope: parseVaultEnvelope(raw),
      recoveryRaw: raw,
      error: null,
    };
  } catch (error) {
    return {
      status: 'error',
      envelope: null,
      recoveryRaw: raw,
      error: error instanceof Error ? error.message : 'Invalid vault data',
    };
  }
}

export const VaultProvider: React.FC<VaultProviderProps> = ({
  children,
  initialData,
  storage = window.localStorage,
}) => {
  const initial = useMemo(
    () =>
      initialData
        ? {
            status: 'unlocked' as const,
            envelope: null,
            recoveryRaw: null,
            error: null,
          }
        : readInitialVault(storage),
    [initialData, storage]
  );
  const [status, setStatus] = useState<VaultStatus>(initial.status);
  const [saveStatus, setSaveStatus] = useState<VaultSaveStatus>('idle');
  const [data, setData] = useState<ConfigDataV2 | null>(initialData ?? null);
  const [error, setError] = useState<string | null>(initial.error);
  const [recoveryRaw, setRecoveryRaw] = useState<string | null>(
    initial.recoveryRaw
  );
  const keyRef = useRef<CryptoKey | null>(null);
  const envelopeRef = useRef<VaultEnvelopeV2 | null>(initial.envelope);
  const revisionRef = useRef(0);
  const testMode = initialData !== undefined;

  const persist = useCallback(
    async (next: ConfigDataV2, revision: number) => {
      if (testMode) {
        setSaveStatus('saved');
        return;
      }
      const key = keyRef.current;
      const envelope = envelopeRef.current;
      if (!key || !envelope) return;
      setSaveStatus('saving');
      try {
        const updated = await encryptWithVaultKey(
          next,
          key,
          getVaultSalt(envelope),
          'local-vault'
        );
        if (revision !== revisionRef.current) return;
        storage.setItem(VAULT_STORAGE_KEY, JSON.stringify(updated));
        envelopeRef.current = updated;
        setRecoveryRaw(JSON.stringify(updated));
        setSaveStatus('saved');
        setError(null);
      } catch (cause) {
        if (revision !== revisionRef.current) return;
        const message =
          cause instanceof Error ? cause.message : 'Failed to save vault';
        setSaveStatus('error');
        setError(message);
      }
    },
    [storage, testMode]
  );

  const replaceData = useCallback(
    (nextValue: ConfigDataV2) => {
      const next = parseConfigData(nextValue);
      setData(next);
      revisionRef.current += 1;
      void persist(next, revisionRef.current);
    },
    [persist]
  );

  const updateData = useCallback(
    (updater: (current: ConfigDataV2) => ConfigDataV2) => {
      setData((current) => {
        if (!current) return current;
        const next = parseConfigData(updater(current));
        revisionRef.current += 1;
        void persist(next, revisionRef.current);
        return next;
      });
    },
    [persist]
  );

  const setup = useCallback(
    async (password: string, nextData: ConfigDataV2, migrateLegacy = false) => {
      const validated = parseConfigData(nextData);
      const created = await createVaultEnvelope(
        validated,
        password,
        'local-vault'
      );
      try {
        storage.setItem(VAULT_STORAGE_KEY, JSON.stringify(created.envelope));
        if (migrateLegacy) finishLegacyMigration(storage);
      } catch (cause) {
        throw new VaultError('STORAGE_FAILED', 'Failed to persist vault', {
          cause,
        });
      }
      keyRef.current = created.key;
      envelopeRef.current = created.envelope;
      setData(validated);
      setRecoveryRaw(JSON.stringify(created.envelope));
      setStatus('unlocked');
      setSaveStatus('saved');
      setError(null);
    },
    [storage]
  );

  const unlock = useCallback(
    async (password: string) => {
      const raw = storage.getItem(VAULT_STORAGE_KEY);
      if (!raw) {
        setStatus('unconfigured');
        throw new VaultError('INVALID_ENVELOPE', 'Vault does not exist');
      }
      setStatus('unlocking');
      setError(null);
      try {
        const result = await decryptVaultEnvelope<unknown>(
          raw,
          password,
          'local-vault'
        );
        const validated = parseConfigData(result.payload);
        keyRef.current = result.key;
        envelopeRef.current = result.envelope;
        setData(validated);
        setStatus('unlocked');
        setSaveStatus('saved');
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : 'Failed to unlock vault';
        setStatus('locked');
        setError(message);
        throw cause;
      }
    },
    [storage]
  );

  const lock = useCallback(() => {
    keyRef.current = null;
    setData(null);
    setStatus(envelopeRef.current ? 'locked' : 'unconfigured');
    setSaveStatus('idle');
  }, []);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const raw = storage.getItem(VAULT_STORAGE_KEY);
      if (!raw || !data) {
        throw new VaultError('INVALID_ENVELOPE', 'Vault is not unlocked');
      }
      await decryptVaultEnvelope(raw, currentPassword, 'local-vault');
      const created = await createVaultEnvelope(
        data,
        newPassword,
        'local-vault'
      );
      // Invalidate encryption started with the previous key before committing
      // the new password envelope.
      revisionRef.current += 1;
      try {
        storage.setItem(VAULT_STORAGE_KEY, JSON.stringify(created.envelope));
      } catch (cause) {
        throw new VaultError('STORAGE_FAILED', 'Failed to persist vault', {
          cause,
        });
      }
      keyRef.current = created.key;
      envelopeRef.current = created.envelope;
      setRecoveryRaw(JSON.stringify(created.envelope));
      setSaveStatus('saved');
      setError(null);
    },
    [data, storage]
  );

  const resetVault = useCallback(() => {
    storage.removeItem(VAULT_STORAGE_KEY);
    keyRef.current = null;
    envelopeRef.current = null;
    revisionRef.current += 1;
    setData(null);
    setRecoveryRaw(null);
    setStatus('unconfigured');
    setSaveStatus('idle');
    setError(null);
  }, [storage]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (saveStatus !== 'saving') return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  const value = useMemo<VaultContextValue>(
    () => ({
      status,
      saveStatus,
      data,
      error,
      recoveryRaw,
      setup,
      unlock,
      lock,
      changePassword,
      updateData,
      replaceData,
      resetVault,
    }),
    [
      status,
      saveStatus,
      data,
      error,
      recoveryRaw,
      setup,
      unlock,
      lock,
      changePassword,
      updateData,
      replaceData,
      resetVault,
    ]
  );

  return (
    <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
  );
};

export function useVault(): VaultContextValue {
  const context = useContext(VaultContext);
  if (!context) throw new Error('useVault must be used within VaultProvider');
  return context;
}
