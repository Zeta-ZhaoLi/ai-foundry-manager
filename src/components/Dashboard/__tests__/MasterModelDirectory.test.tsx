import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n';
import { MasterModelDirectory } from '../MasterModelDirectory';

describe('MasterModelDirectory', () => {
  it('clicking a model item calls onCopy with exact model id', () => {
    const onCopy = vi.fn();

    const { getAllByRole, getByText } = render(
      <I18nextProvider i18n={i18n}>
        <MasterModelDirectory
          masterText=""
          onMasterTextChange={() => {}}
          masterGroups={[['gpt-4o']]}
          masterGroupLines={[[['gpt-4o']]]}
          masterModels={['gpt-4o']}
          deployedModelsOrdered={['gpt-4o']}
          deployedRegionCounts={{ 'gpt-4o': 3 }}
          onCopy={onCopy}
        />
      </I18nextProvider>
    );

    // Expand panel (collapsed by default). First button is the collapse toggle.
    fireEvent.click(getAllByRole('button')[0]);

    const modelText = getByText('gpt-4o');
    const modelButton = modelText.closest('button');
    expect(modelButton).not.toBeNull();

    fireEvent.click(modelButton!);
    expect(onCopy).toHaveBeenCalledWith('gpt-4o', 'gpt-4o');
  });
});
