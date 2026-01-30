import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import es from './locales/es.json';
import ptBR from './locales/pt-BR.json';
import ko from './locales/ko.json';

const LANG_STORAGE_KEY = 'ai-foundry-manager:lang';
const LEGACY_LANG_STORAGE_KEY = 'azure-openai-manager:lang';

const SUPPORTED_LANGUAGES = [
  'zh',
  'en',
  'ja',
  'fr',
  'de',
  'es',
  'pt-BR',
  'ko',
] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const isSupportedLanguage = (lang: string): lang is SupportedLanguage => {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang);
};

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
        console.log(
          '[Migration] Migrating language preference from legacy key to new key'
        );
        localStorage.setItem(LANG_STORAGE_KEY, legacySaved);
        saved = legacySaved;
        console.log(
          '[Migration] Language preference migration completed successfully'
        );
      }
    }

    if (saved && isSupportedLanguage(saved)) {
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
    ja: { translation: ja },
    fr: { translation: fr },
    de: { translation: de },
    es: { translation: es },
    'pt-BR': { translation: ptBR },
    ko: { translation: ko },
  },
  lng: getSavedLanguage(),
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
});

export { LANG_STORAGE_KEY, SUPPORTED_LANGUAGES };
export default i18n;
