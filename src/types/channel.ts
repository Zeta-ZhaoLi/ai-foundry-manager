// 与 new-api 的 Channel 结构保持子集一致，方便前端使用

export interface Channel {
  id: number;
  type: number;
  name: string;
  tag?: string | null;
  base_url?: string | null;
  models: string;
  remark?: string | null;
}

export interface ChannelListResponse {
  success: boolean;
  message: string;
  data: {
    items: Channel[];
    total: number;
  };
}

export interface FetchModelsResponse {
  success: boolean;
  message: string;
  data: string[];
}

