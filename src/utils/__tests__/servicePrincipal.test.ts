import { describe, expect, it } from 'vitest';

import {
  isCompleteServicePrincipal,
  parseServicePrincipalJson,
} from '../servicePrincipal';

describe('servicePrincipal', () => {
  it('parses valid Azure CLI Service Principal JSON', () => {
    const result = parseServicePrincipalJson(
      JSON.stringify({
        appId: 'app-id',
        displayName: 'azure-cli',
        password: 'secret',
        tenant: 'tenant-id',
      })
    );

    expect(result.success).toBe(true);
    expect(result.credential).toEqual({
      appId: 'app-id',
      displayName: 'azure-cli',
      password: 'secret',
      tenant: 'tenant-id',
    });
    expect(isCompleteServicePrincipal(result.credential)).toBe(true);
  });

  it('returns a clear error for invalid JSON and missing fields', () => {
    expect(parseServicePrincipalJson('{').success).toBe(false);

    const missing = parseServicePrincipalJson(
      JSON.stringify({ appId: 'app-id' })
    );

    expect(missing.success).toBe(false);
    expect(missing.error).toContain('password');
    expect(missing.error).toContain('tenant');
  });
});
