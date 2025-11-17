export interface NewApiConfig {
  baseUrl: string;
  adminToken: string;
}

// 简单的运行时配置：
// - 开发环境下：留空，配合 Vite 代理走同源 /api，避免 CORS
// - 生产环境下：可改成完整的 new-api 地址（如 https://newapi.example.com）
export const defaultConfig: NewApiConfig = {
  baseUrl: '',
  adminToken: '',
};
