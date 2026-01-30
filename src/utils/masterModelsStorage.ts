import { DEFAULT_MASTER_MODEL_DIRECTORY_TEXT } from '../constants/defaultMasterModelDirectory';

export const MASTER_MODELS_STORAGE_KEY = 'ai-foundry-manager:master-models';
export const LEGACY_MASTER_MODELS_STORAGE_KEY =
  'azure-openai-manager:master-models';

export type MasterModelsInitSource = 'existing' | 'legacy' | 'default';

export const loadInitialMasterModelsText = (
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  defaultText: string = DEFAULT_MASTER_MODEL_DIRECTORY_TEXT
): { text: string; source: MasterModelsInitSource } => {
  const existing = storage.getItem(MASTER_MODELS_STORAGE_KEY);
  if (existing !== null) {
    return { text: existing, source: 'existing' };
  }

  const legacy = storage.getItem(LEGACY_MASTER_MODELS_STORAGE_KEY);
  if (legacy !== null) {
    storage.setItem(MASTER_MODELS_STORAGE_KEY, legacy);
    return { text: legacy, source: 'legacy' };
  }

  storage.setItem(MASTER_MODELS_STORAGE_KEY, defaultText);
  return { text: defaultText, source: 'default' };
};
