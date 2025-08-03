// environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.yourapp.com/api',
  wsUrl: 'wss://api.yourapp.com',
  fileUpload: {
    maxSize: 10 * 1024 * 1024,
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
    ],
  },
  analytics: {
    enabled: true,
    batchSize: 20,
    flushInterval: 15000,
  },
  performance: {
    enableServiceWorker: true,
    cacheTimeout: 600000, // 10 minutes
    virtualScrolling: true,
  },
};
