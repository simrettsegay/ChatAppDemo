// src/config/index.ts
type Config = {
  appName: string;
  api: {
    baseUrl: string;
    timeout: number;
  };
  clientUrl: string;
  storage: {
    tokenKey: string;
    userKey: string;
  };
  features: {
    enableAnalytics: boolean;
  };
};

export const config: Config = {
  appName: import.meta.env.VITE_APP_TITLE || 'ExceedChat',
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    timeout: 10000, // 10 seconds
  },
  clientUrl: import.meta.env.VITE_CLIENT_URL || 'http://localhost:3000',
  storage: {
    tokenKey: 'exceed_chat_token',
    userKey: 'exceed_chat_user',
  },
  features: {
    enableAnalytics: false,
  },
} as const;

// Export for backward compatibility
export default config;