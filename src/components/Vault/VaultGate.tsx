import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../ui';
import { useVault } from '../../contexts/VaultContext';
import {
  finishLegacyMigration,
  readLegacyConfigData,
} from '../../persistence/config';
import {
  LEGACY_ACCOUNTS_BACKUP_KEY,
  LEGACY_ACCOUNTS_STORAGE_KEY,
  LEGACY_ACCOUNTS_STORAGE_KEY_V1,
  MIN_VAULT_PASSWORD_LENGTH,
} from '../../security/vault';

interface VaultGateProps {
  children: React.ReactNode;
}

function downloadRawData(raw: string): void {
  const blob = new Blob([raw], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ai-foundry-manager-recovery-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const VaultGate: React.FC<VaultGateProps> = ({ children }) => {
  const { t } = useTranslation();
  const vault = useVault();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const legacyRecoveryRaw =
    localStorage.getItem(LEGACY_ACCOUNTS_BACKUP_KEY) ??
    localStorage.getItem(LEGACY_ACCOUNTS_STORAGE_KEY) ??
    localStorage.getItem(LEGACY_ACCOUNTS_STORAGE_KEY_V1);
  const recoveryRaw = vault.recoveryRaw ?? legacyRecoveryRaw;

  if (vault.status === 'unlocked') return <>{children}</>;

  const isSetup = vault.status === 'unconfigured';
  const isRecovery = vault.status === 'error';
  const canReset =
    isRecovery || Boolean(isSetup && formError && legacyRecoveryRaw);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (password.length < MIN_VAULT_PASSWORD_LENGTH) {
      setFormError(t('vault.passwordLength'));
      return;
    }
    if (isSetup && password !== confirmation) {
      setFormError(t('vault.mismatch'));
      return;
    }
    setSubmitting(true);
    try {
      if (isSetup) {
        const legacy = readLegacyConfigData(localStorage);
        await vault.setup(password, legacy.data, legacy.hadLegacyData);
      } else {
        await vault.unlock(password);
      }
      setPassword('');
      setConfirmation('');
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : t(isSetup ? 'vault.setupFailed' : 'vault.unlockFailed')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    if (!window.confirm(t('vault.resetConfirm'))) return;
    // The raw legacy backup remains available under its recovery key.
    finishLegacyMigration(localStorage);
    vault.resetVault();
    setFormError(null);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <section className="w-full max-w-md border border-border bg-background p-5 shadow-lg rounded-lg">
        <h1 className="text-lg font-semibold">
          {isRecovery
            ? t('vault.recoveryTitle')
            : t(isSetup ? 'vault.setupTitle' : 'vault.unlockTitle')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isRecovery
            ? t('vault.recoveryDescription')
            : t(isSetup ? 'vault.setupDescription' : 'vault.unlockDescription')}
        </p>

        {!isRecovery && (
          <form className="mt-5 space-y-4" onSubmit={submit}>
            <Input
              type="password"
              autoComplete={isSetup ? 'new-password' : 'current-password'}
              label={t('vault.password')}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={submitting || vault.status === 'unlocking'}
            />
            {isSetup && (
              <Input
                type="password"
                autoComplete="new-password"
                label={t('vault.confirmPassword')}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={submitting}
              />
            )}
            {(formError || vault.error) && (
              <p role="alert" className="text-sm text-red-500">
                {formError || vault.error}
              </p>
            )}
            <Button type="submit" className="w-full" loading={submitting}>
              {t(isSetup ? 'vault.create' : 'vault.unlock')}
            </Button>
          </form>
        )}

        {(isRecovery || formError) && recoveryRaw && (
          <Button
            type="button"
            variant="secondary"
            className="mt-4 w-full"
            onClick={() => downloadRawData(recoveryRaw)}
          >
            {t('vault.downloadRaw')}
          </Button>
        )}
        {canReset && (
          <Button
            type="button"
            variant="danger"
            className="mt-3 w-full"
            onClick={reset}
          >
            {t('vault.reset')}
          </Button>
        )}
      </section>
    </main>
  );
};
