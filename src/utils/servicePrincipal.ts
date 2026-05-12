export interface ServicePrincipalCredential {
  appId: string;
  displayName?: string;
  password?: string;
  tenant: string;
}

export interface ServicePrincipalParseResult {
  success: boolean;
  credential?: ServicePrincipalCredential;
  error?: string;
}

function readStringField(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function isCompleteServicePrincipal(
  credential?: ServicePrincipalCredential
): boolean {
  return Boolean(
    credential?.appId.trim() &&
      credential?.tenant.trim() &&
      credential?.password?.trim()
  );
}

export function parseServicePrincipalJson(
  jsonString: string
): ServicePrincipalParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      success: false,
      error: 'Service Principal JSON must be an object',
    };
  }

  const raw = parsed as Record<string, unknown>;
  const credential: ServicePrincipalCredential = {
    appId: readStringField(raw.appId),
    displayName: readStringField(raw.displayName) || undefined,
    password: readStringField(raw.password),
    tenant: readStringField(raw.tenant),
  };

  const missing = [
    ['appId', credential.appId],
    ['password', credential.password],
    ['tenant', credential.tenant],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    return {
      success: false,
      error: `Missing required field(s): ${missing.join(', ')}`,
    };
  }

  return {
    success: true,
    credential,
  };
}
