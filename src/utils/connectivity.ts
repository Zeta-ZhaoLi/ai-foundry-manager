export interface ConnectivityResult {
  success: boolean;
  latencyMs?: number;
  error?: string;
  statusCode?: number;
}

/**
 * Test connectivity to an Azure OpenAI endpoint
 * Uses the models list endpoint as a lightweight health check
 */
export async function testAzureEndpoint(
  endpoint: string,
  apiKey: string
): Promise<ConnectivityResult> {
  if (!endpoint || !apiKey) {
    return { success: false, error: 'Missing endpoint or API key' };
  }

  // Normalize endpoint (remove trailing slash)
  const normalizedEndpoint = endpoint.replace(/\/+$/, '');

  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(
      `${normalizedEndpoint}/openai/models?api-version=2024-02-01`,
      {
        method: 'GET',
        headers: {
          'api-key': apiKey,
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - start);

    if (response.ok) {
      return { success: true, latencyMs, statusCode: response.status };
    }

    // Handle common error codes
    let error = `HTTP ${response.status}`;
    switch (response.status) {
      case 401:
        error = 'Invalid API key';
        break;
      case 403:
        error = 'Access forbidden';
        break;
      case 404:
        error = 'Endpoint not found';
        break;
      case 429:
        error = 'Rate limited';
        break;
      case 500:
      case 502:
      case 503:
        error = 'Server error';
        break;
    }

    return { success: false, error, latencyMs, statusCode: response.status };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Connection timeout', latencyMs };
      }
      return { success: false, error: err.message, latencyMs };
    }

    return { success: false, error: 'Unknown error', latencyMs };
  }
}
