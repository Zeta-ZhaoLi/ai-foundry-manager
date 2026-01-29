import { describe, it, expect } from 'vitest';
import {
  parseModels,
  parseMasterModelDirectory,
  orderModelsByMaster,
  generateId,
  isValidUrl,
  isValidApiKey,
} from '../common';

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

  describe('parseMasterModelDirectory', () => {
    it('should group by blank lines', () => {
      const result = parseMasterModelDirectory(
        'gpt-4o\n\nclaude-3-opus\nclaude-3-5-sonnet'
      );
      expect(result.groups).toEqual([
        ['gpt-4o'],
        ['claude-3-opus', 'claude-3-5-sonnet'],
      ]);
      expect(result.allModels).toEqual([
        'gpt-4o',
        'claude-3-opus',
        'claude-3-5-sonnet',
      ]);
    });

    it('should accept mixed separators within a group', () => {
      const result = parseMasterModelDirectory('gpt-4o, gpt-4o-mini\n o1-mini');
      expect(result.groups).toEqual([['gpt-4o', 'gpt-4o-mini', 'o1-mini']]);
      expect(result.allModels).toEqual(['gpt-4o', 'gpt-4o-mini', 'o1-mini']);
    });

    it('should treat multiple blank lines as one separator', () => {
      const result = parseMasterModelDirectory('a\n\n\n\nb');
      expect(result.groups).toEqual([['a'], ['b']]);
      expect(result.allModels).toEqual(['a', 'b']);
    });

    it('should de-duplicate by first appearance globally', () => {
      const result = parseMasterModelDirectory('a\n\n a\n b\n a');
      expect(result.groups).toEqual([['a'], ['b']]);
      expect(result.allModels).toEqual(['a', 'b']);
    });

    it('should return empty groups for empty input', () => {
      expect(parseMasterModelDirectory('')).toEqual({
        groups: [],
        allModels: [],
      });
      expect(parseMasterModelDirectory('   ')).toEqual({
        groups: [],
        allModels: [],
      });
    });
  });

  describe('orderModelsByMaster', () => {
    it('should order by master first, then append extras', () => {
      const result = orderModelsByMaster(
        ['x', 'b', 'a', 'y', 'b'],
        ['a', 'b', 'c']
      );
      expect(result).toEqual(['a', 'b', 'x', 'y']);
    });

    it('should ignore empty tokens', () => {
      const result = orderModelsByMaster(['', '  ', 'a'], ['a']);
      expect(result).toEqual(['a']);
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
