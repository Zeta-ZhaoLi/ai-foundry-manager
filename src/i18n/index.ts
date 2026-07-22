import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';

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

const localeLoaders: Record<
  Exclude<SupportedLanguage, 'zh'>,
  () => Promise<{ default: Record<string, unknown> }>
> = {
  en: () => import('./locales/en.json'),
  ja: () => import('./locales/ja.json'),
  fr: () => import('./locales/fr.json'),
  de: () => import('./locales/de.json'),
  es: () => import('./locales/es.json'),
  'pt-BR': () => import('./locales/pt-BR.json'),
  ko: () => import('./locales/ko.json'),
};

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

const initialLanguage = getSavedLanguage() as SupportedLanguage;

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
  },
  lng: initialLanguage,
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
});

async function ensureLanguage(language: SupportedLanguage): Promise<void> {
  if (language === 'zh' || i18n.hasResourceBundle(language, 'translation')) {
    return;
  }
  const locale = await localeLoaders[language]();
  i18n.addResourceBundle(language, 'translation', locale.default, true, true);
}

export async function changeAppLanguage(
  language: SupportedLanguage
): Promise<void> {
  await ensureLanguage(language);
  await i18n.changeLanguage(language);
}

if (initialLanguage !== 'zh') {
  void changeAppLanguage(initialLanguage);
}

export { LANG_STORAGE_KEY, SUPPORTED_LANGUAGES };
export default i18n;
