import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVault } from '../../contexts/VaultContext';
import { MIN_VAULT_PASSWORD_LENGTH } from '../../security/vault';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
} from '../ui';

export const VaultControls: React.FC = () => {
  const { t } = useTranslation();
  const vault = useVault();
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const statusLabel =
    vault.saveStatus === 'saving'
      ? t('vault.saveStatusSaving')
      : vault.saveStatus === 'error'
        ? t('vault.saveStatusError')
        : t('vault.saveStatusSaved');

  const close = () => {
    setOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmation('');
    setError(null);
    setSuccess(false);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPassword.length < MIN_VAULT_PASSWORD_LENGTH) {
      setError(t('vault.passwordLength'));
      return;
    }
    if (newPassword !== confirmation) {
      setError(t('vault.mismatch'));
      return;
    }
    setSubmitting(true);
    try {
      await vault.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('vault.unlockFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <span
        className={
          vault.saveStatus === 'error'
            ? 'text-xs text-red-500'
            : 'text-xs text-muted-foreground'
        }
        title={vault.error || statusLabel}
      >
        {statusLabel}
      </span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-2.5 py-1 rounded-full border border-border bg-muted/60 text-muted-foreground hover:bg-muted/80 text-xs transition-colors"
      >
        {t('vault.changePassword')}
      </button>
      <button
        type="button"
        onClick={vault.lock}
        disabled={vault.saveStatus === 'saving'}
        className="px-2.5 py-1 rounded-full border border-border bg-muted/60 text-muted-foreground hover:bg-muted/80 text-xs transition-colors disabled:opacity-50"
      >
        {t('vault.lock')}
      </button>

      <Dialog open={open} onOpenChange={(next) => !next && close()}>
        <DialogContent size="md" onClose={close}>
          <DialogHeader>
            <DialogTitle>{t('vault.changePassword')}</DialogTitle>
          </DialogHeader>
          <form className="mt-4 space-y-4" onSubmit={submit}>
            <Input
              type="password"
              autoComplete="current-password"
              label={t('vault.currentPassword')}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <Input
              type="password"
              autoComplete="new-password"
              label={t('vault.newPassword')}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <Input
              type="password"
              autoComplete="new-password"
              label={t('vault.confirmNewPassword')}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
            {error && (
              <p role="alert" className="text-sm text-red-500">
                {error}
              </p>
            )}
            {success && (
              <p role="status" className="text-sm text-green-500">
                {t('vault.changeSuccess')}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={close}>
                {t('vault.cancel')}
              </Button>
              <Button type="submit" loading={submitting}>
                {t('vault.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
