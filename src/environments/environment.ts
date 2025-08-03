// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'ws://localhost:3000',
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv'
    ]
  },
  analytics: {
    enabled: true,
    batchSize: 10,
    flushInterval: 30000
  },
  performance: {
    enableServiceWorker: false,
    cacheTimeout: 300000, // 5 minutes
    virtualScrolling: true
  }
};
