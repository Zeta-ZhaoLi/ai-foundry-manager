import { describe, it, expect } from 'vitest';
import { parseModels, generateId, isValidUrl, isValidApiKey } from '../common';

describe('Common Utils', () => {
  describe('parseModels', () => {
    it('should parse comma-separated models', () => {
      const result = parseModels('gpt-4o, gpt-4o-mini, gpt-35-turbo');
      expect(result).toEqual(['gpt-4o', 'gpt-4o-mini', 'gpt-35-turbo']);
    });

    it('should parse space-separated models', () => {
      const result = parseModels('gpt-4o gpt-4o-mini gpt-35-turbo');
      expect(result).toEqual(['gpt-4o', 'gpt-4o-mini', 'gpt-35-turbo']);
    });

    it('should remove duplicates', () => {
      const result = parseModels('gpt-4o, gpt-4o, gpt-4o-mini');
      expect(result).toEqual(['gpt-4o', 'gpt-4o-mini']);
    });

    it('should return empty array for empty input', () => {
      expect(parseModels('')).toEqual([]);
      expect(parseModels('   ')).toEqual([]);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId('test');
      const id2 = generateId('test');
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^test_/);
    });
  });

  describe('isValidUrl', () => {
    it('should validate URLs correctly', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('not a url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('isValidApiKey', () => {
    it('should validate API keys', () => {
      expect(isValidApiKey('a'.repeat(32))).toBe(true);
      expect(isValidApiKey('a'.repeat(31))).toBe(false);
      expect(isValidApiKey('')).toBe(false);
    });
  });
});
