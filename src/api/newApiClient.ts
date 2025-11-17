import type { NewApiConfig } from '../config';
import type {
  Channel,
  ChannelListResponse,
  FetchModelsResponse,
} from '../types/channel';

export class NewApiClient {
  private readonly baseUrl: string;
  private readonly adminToken: string;

  constructor(config: NewApiConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.adminToken = config.adminToken;
  }

  private get headers(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.adminToken) {
      headers['Authorization'] = `Bearer ${this.adminToken}`;
    }
    return headers;
  }

  async listAzureChannels(): Promise<Channel[]> {
    const url = `${this.baseUrl}/api/channel/?p=1&page_size=10000&type=3`;
    const res = await fetch(url, {
      method: 'GET',
      headers: this.headers,
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(
        `listAzureChannels failed: ${res.status} ${res.statusText}`,
      );
    }
    const body: ChannelListResponse = await res.json();
    if (!body.success) {
      throw new Error(body.message || 'listAzureChannels: api error');
    }
    return body.data.items || [];
  }

  async fetchChannelModels(id: number): Promise<string[]> {
    const url = `${this.baseUrl}/api/channel/fetch_models/${id}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: this.headers,
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(
        `fetchChannelModels failed: ${res.status} ${res.statusText}`,
      );
    }
    const body: FetchModelsResponse = await res.json();
    if (!body.success) {
      throw new Error(body.message || 'fetchChannelModels: api error');
    }
    return body.data || [];
  }
}

