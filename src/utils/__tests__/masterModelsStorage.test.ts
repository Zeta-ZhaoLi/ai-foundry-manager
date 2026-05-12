import { describe, it, expect, beforeEach } from 'vitest';
import defaultMasterModelDirectoryText from '../../constants/defaultMasterModelDirectory.txt?raw';
import { DEFAULT_MASTER_MODEL_DIRECTORY_TEXT } from '../../constants/defaultMasterModelDirectory';
import {
  LEGACY_MASTER_MODELS_STORAGE_KEY,
  loadInitialMasterModelsText,
  MASTER_MODELS_STORAGE_KEY,
} from '../masterModelsStorage';

describe('loadInitialMasterModelsText', () => {
  beforeEach(() => {
    localStorage.removeItem(MASTER_MODELS_STORAGE_KEY);
    localStorage.removeItem(LEGACY_MASTER_MODELS_STORAGE_KEY);
  });

  it('seeds default on fresh install (no new key, no legacy key)', () => {
    const res = loadInitialMasterModelsText(localStorage);

    expect(res.source).toBe('default');
    expect(res.text).toBe(DEFAULT_MASTER_MODEL_DIRECTORY_TEXT);
    expect(localStorage.getItem(MASTER_MODELS_STORAGE_KEY)).toBe(
      DEFAULT_MASTER_MODEL_DIRECTORY_TEXT
    );

    // Spot-check formatting constraints
    expect(DEFAULT_MASTER_MODEL_DIRECTORY_TEXT).toContain('\n\n');
    expect(DEFAULT_MASTER_MODEL_DIRECTORY_TEXT).not.toContain(',,');
    expect(DEFAULT_MASTER_MODEL_DIRECTORY_TEXT.trimEnd()).toBe(
      DEFAULT_MASTER_MODEL_DIRECTORY_TEXT
    );
  });

  it('loads the editable default model list file as the seed source', () => {
    expect(DEFAULT_MASTER_MODEL_DIRECTORY_TEXT).toBe(
      defaultMasterModelDirectoryText.replace(/\r\n/g, '\n')
    );
  });

  it('does not overwrite existing value (including empty string)', () => {
    localStorage.setItem(MASTER_MODELS_STORAGE_KEY, '');
    localStorage.setItem(LEGACY_MASTER_MODELS_STORAGE_KEY, 'legacy');

    const res = loadInitialMasterModelsText(localStorage);

    expect(res.source).toBe('existing');
    expect(res.text).toBe('');
    expect(localStorage.getItem(MASTER_MODELS_STORAGE_KEY)).toBe('');
  });

  it('migrates legacy value when new key is missing', () => {
    localStorage.setItem(LEGACY_MASTER_MODELS_STORAGE_KEY, 'legacy-text');

    const res = loadInitialMasterModelsText(localStorage);

    expect(res.source).toBe('legacy');
    expect(res.text).toBe('legacy-text');
    expect(localStorage.getItem(MASTER_MODELS_STORAGE_KEY)).toBe('legacy-text');
  });
});
