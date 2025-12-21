import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';
import en from './locales/en.json';

const LANG_STORAGE_KEY = 'ai-foundry-manager:lang';
const LEGACY_LANG_STORAGE_KEY = 'azure-openai-manager:lang';

// 从 localStorage 读取保存的语言，默认为中文
const getSavedLanguage = (): string => {
  if (typeof window === 'undefined') return 'zh';
  try {
    // 尝试从新 key 读取数据
    let saved = localStorage.getItem(LANG_STORAGE_KEY);

    // 如果新 key 没有数据，尝试从旧 key 迁移
    if (!saved) {
      const legacySaved = localStorage.getItem(LEGACY_LANG_STORAGE_KEY);
      if (legacySaved) {
        console.log('[Migration] Migrating language preference from legacy key to new key');
        localStorage.setItem(LANG_STORAGE_KEY, legacySaved);
        saved = legacySaved;
        console.log('[Migration] Language preference migration completed successfully');
      }
    }

    if (saved === 'zh' || saved === 'en') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'zh';
};

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: getSavedLanguage(),
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
});

export { LANG_STORAGE_KEY };
export default i18n;
