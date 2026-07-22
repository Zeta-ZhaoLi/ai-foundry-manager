import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '../../../i18n';
import { VaultProvider } from '../../../contexts/VaultContext';
import {
  LEGACY_ACCOUNTS_BACKUP_KEY,
  LEGACY_ACCOUNTS_STORAGE_KEY,
} from '../../../security/vault';
import { VaultGate } from '../VaultGate';

function renderGate() {
  return render(
    <I18nextProvider i18n={i18n}>
      <VaultProvider>
        <VaultGate>
          <div>Unlocked dashboard</div>
        </VaultGate>
      </VaultProvider>
    </I18nextProvider>
  );
}

describe('VaultGate recovery', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('preserves corrupt legacy data and offers a reset path', async () => {
    localStorage.setItem(LEGACY_ACCOUNTS_STORAGE_KEY, '{broken');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderGate();

    fireEvent.change(screen.getByLabelText(i18n.t('vault.password')), {
      target: { value: 'correct horse battery staple' },
    });
    fireEvent.change(screen.getByLabelText(i18n.t('vault.confirmPassword')), {
      target: { value: 'correct horse battery staple' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: i18n.t('vault.create') })
    );

    await screen.findByRole('alert');
    expect(localStorage.getItem(LEGACY_ACCOUNTS_STORAGE_KEY)).toBe('{broken');
    expect(localStorage.getItem(LEGACY_ACCOUNTS_BACKUP_KEY)).toBe('{broken');

    fireEvent.click(
      screen.getByRole('button', { name: i18n.t('vault.reset') })
    );
    await waitFor(() =>
      expect(localStorage.getItem(LEGACY_ACCOUNTS_STORAGE_KEY)).toBeNull()
    );
    expect(localStorage.getItem(LEGACY_ACCOUNTS_BACKUP_KEY)).toBe('{broken');
  });
});
