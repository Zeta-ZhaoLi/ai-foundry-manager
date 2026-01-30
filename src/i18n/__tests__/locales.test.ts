import { describe, it, expect } from 'vitest';

import en from '../locales/en.json';
import zh from '../locales/zh.json';
import ja from '../locales/ja.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import es from '../locales/es.json';
import ptBR from '../locales/pt-BR.json';
import ko from '../locales/ko.json';

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

const collectKeyPaths = (obj: JsonObject, prefix = ''): string[] => {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeyPaths(v as JsonObject, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
};

describe('i18n locale key completeness', () => {
  const canonical = en as unknown as JsonObject;
  const canonicalKeys = new Set(collectKeyPaths(canonical));

  const locales: Array<{ code: string; data: JsonObject }> = [
    { code: 'en', data: en as unknown as JsonObject },
    { code: 'zh', data: zh as unknown as JsonObject },
    { code: 'ja', data: ja as unknown as JsonObject },
    { code: 'fr', data: fr as unknown as JsonObject },
    { code: 'de', data: de as unknown as JsonObject },
    { code: 'es', data: es as unknown as JsonObject },
    { code: 'pt-BR', data: ptBR as unknown as JsonObject },
    { code: 'ko', data: ko as unknown as JsonObject },
  ];

  for (const locale of locales) {
    it(`locale ${locale.code} contains all canonical keys`, () => {
      const localeKeys = new Set(collectKeyPaths(locale.data));
      const missing: string[] = [];
      for (const key of canonicalKeys) {
        if (!localeKeys.has(key)) missing.push(key);
      }

      expect(
        missing,
        `Missing keys in ${locale.code}:\n${missing.join('\n')}`
      ).toEqual([]);
    });
  }
});
