
window.TASKS_API_URL = 'https://your-api-id.execute-api.us-east-1.amazonaws.com/dev';


window.APP_CONFIG = {
  environment: 'development', 
  
  api: {
    baseUrl: window.TASKS_API_URL,
    timeout: 10000, 
    retryAttempts: 3
  },
  
  features: {
    offlineSync: true,
    analytics: false,
    debugMode: true
  },
  
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    celebrationEffects: true
  }
};

if (window.APP_CONFIG.features.debugMode) {
  console.log('🎯 Collaboration Station Task Management loaded');
  console.log('📍 API URL:', window.TASKS_API_URL);
  console.log('⚙️ Configuration:', window.APP_CONFIG);
}