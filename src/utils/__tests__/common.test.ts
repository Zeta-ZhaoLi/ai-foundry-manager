import { describe, it, expect } from 'vitest';
import {
  parseModels,
  parseMasterModelDirectory,
  computeDeployedModels,
  computeModelRegionCounts,
  orderModelsByMaster,
  generateId,
  isValidUrl,
  isValidApiKey,
  normalizeAiServicesEndpoint,
  normalizeFoundryProjectEndpoint,
  parseAzureEndpointIdentity,
  deriveAzureEndpointSetFromAny,
  extractAzureResourceName,
  generateRegionIdentityBundleFromAccountEmail,
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
      expect(result.groupLines).toEqual([
        [['gpt-4o']],
        [['claude-3-opus'], ['claude-3-5-sonnet']],
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
      expect(result.groupLines).toEqual([
        [['gpt-4o', 'gpt-4o-mini'], ['o1-mini']],
      ]);
      expect(result.allModels).toEqual(['gpt-4o', 'gpt-4o-mini', 'o1-mini']);
    });

    it('should treat multiple blank lines as one separator', () => {
      const result = parseMasterModelDirectory('a\n\n\n\nb');
      expect(result.groups).toEqual([['a'], ['b']]);
      expect(result.groupLines).toEqual([[['a']], [['b']]]);
      expect(result.allModels).toEqual(['a', 'b']);
    });

    it('should de-duplicate by first appearance globally', () => {
      const result = parseMasterModelDirectory('a\n\n a\n b\n a');
      expect(result.groups).toEqual([['a'], ['b']]);
      expect(result.groupLines).toEqual([[['a']], [['b']]]);
      expect(result.allModels).toEqual(['a', 'b']);
    });

    it('should return empty groups for empty input', () => {
      expect(parseMasterModelDirectory('')).toEqual({
        groups: [],
        groupLines: [],
        allModels: [],
      });
      expect(parseMasterModelDirectory('   ')).toEqual({
        groups: [],
        groupLines: [],
        allModels: [],
      });
    });
  });

  describe('computeDeployedModels', () => {
    it('should compute union by first appearance order', () => {
      const result = computeDeployedModels([['b', 'a'], ['a', 'c'], ['d']]);
      expect(result).toEqual(['b', 'a', 'c', 'd']);
    });

    it('should ignore empty values', () => {
      const result = computeDeployedModels([['', '  ', 'a']]);
      expect(result).toEqual(['a']);
    });
  });

  describe('computeModelRegionCounts', () => {
    it('should count per region (dedupe within region)', () => {
      const result = computeModelRegionCounts([
        ['a', 'a', 'b'],
        ['b', 'c'],
        [],
      ]);
      expect(result).toEqual({ a: 1, b: 2, c: 1 });
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

  describe('Foundry endpoint conversion', () => {
    it('parses resource and project from Foundry project endpoint', () => {
      expect(
        parseAzureEndpointIdentity(
          'https://616d30b6ef130dde-1161-resource.services.ai.azure.com/api/projects/616d30b6ef130dde-1161/'
        )
      ).toEqual({
        resourceName: '616d30b6ef130dde-1161-resource',
        projectId: '616d30b6ef130dde-1161',
      });
    });

    it('extracts resource name from Foundry host when projectId differs', () => {
      expect(
        extractAzureResourceName(
          'https://pedrolaureanoferreira68-resource.services.ai.azure.com/api/projects/pedrolaureanoferreira68-6863'
        )
      ).toBe('pedrolaureanoferreira68-resource');
    });

    it('builds full endpoint set from OpenAI endpoint', () => {
      expect(
        deriveAzureEndpointSetFromAny(
          'https://616d30b6ef130dde-1161-resource.openai.azure.com'
        )
      ).toEqual({
        foundryProjectEndpoint:
          'https://616d30b6ef130dde-1161-resource.services.ai.azure.com/api/projects/616d30b6ef130dde-1161-resource',
        openaiEndpoint:
          'https://616d30b6ef130dde-1161-resource.openai.azure.com',
        aiServicesEndpoint:
          'https://616d30b6ef130dde-1161-resource.cognitiveservices.azure.com',
        anthropicEndpoint:
          'https://616d30b6ef130dde-1161-resource.services.ai.azure.com/anthropic',
      });
    });

    it('normalizes trailing slash for Foundry and AI Services endpoints', () => {
      expect(
        normalizeFoundryProjectEndpoint(
          'https://foo.services.ai.azure.com/api/projects/bar/'
        )
      ).toBe('https://foo.services.ai.azure.com/api/projects/bar');
      expect(
        normalizeAiServicesEndpoint('https://foo.cognitiveservices.azure.com/')
      ).toBe('https://foo.cognitiveservices.azure.com');
    });
  });

  describe('region identity generation', () => {
    it('generates a unique endpoint bundle from account email', () => {
      const result = generateRegionIdentityBundleFromAccountEmail(
        'jessicabarrios060193@gmail.com',
        [],
        () => 0.1
      );

      expect(result.ok).toBe(true);
      expect(result.bundle?.resourceName).toBe(
        'jessicabarrios0601-1111-resource'
      );
      expect(result.bundle?.resourceName.length).toBeLessThanOrEqual(32);
      expect(result.bundle?.projectId).toBe('jessicabarrios060193-1111');
      expect(result.bundle?.foundryProjectEndpoint).toBe(
        'https://jessicabarrios0601-1111-resource.services.ai.azure.com/api/projects/jessicabarrios060193-1111'
      );
      expect(result.bundle?.openaiEndpoint).toBe(
        'https://jessicabarrios0601-1111-resource.openai.azure.com'
      );
    });

    it('retries when a sibling region already uses the same resource name', () => {
      const values = [
        0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8,
      ];
      let index = 0;
      const random = () => values[index++];
      const result = generateRegionIdentityBundleFromAccountEmail(
        'sample@gmail.com',
        ['sample-1234-resource'],
        random
      );

      expect(result.ok).toBe(true);
      expect(result.bundle?.resourceName).toBe('sample-5678-resource');
      expect(result.bundle?.projectId).toBe('sample-5678');
    });

    it('rejects non-email account names', () => {
      expect(
        generateRegionIdentityBundleFromAccountEmail('My Test Account', [])
      ).toEqual({
        ok: false,
        error: 'invalid_account_email',
      });
    });
  });
});
