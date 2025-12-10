import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';
import en from './locales/en.json';

const LANG_STORAGE_KEY = 'azure-openai-manager:lang';

// 从 localStorage 读取保存的语言，默认为中文
const getSavedLanguage = (): string => {
  if (typeof window === 'undefined') return 'zh';
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
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
