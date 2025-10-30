/**
 * Configuration for Collaboration Station Task Management
 * Update these values after deploying your AWS infrastructure
 */

// Replace with your actual API Gateway URL after deployment
// You can find this URL in the CloudFormation stack outputs
window.TASKS_API_URL = 'https://your-api-id.execute-api.us-east-1.amazonaws.com/dev';

// Environment configuration
window.APP_CONFIG = {
  environment: 'development', // 'development', 'staging', 'production'
  
  // API Configuration
  api: {
    baseUrl: window.TASKS_API_URL,
    timeout: 10000, // 10 seconds
    retryAttempts: 3
  },
  
  // Feature flags
  features: {
    offlineSync: true,
    analytics: false,
    debugMode: true
  },
  
  // UI Configuration for neurodivergent students
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    celebrationEffects: true
  }
};

// Development mode helpers
if (window.APP_CONFIG.features.debugMode) {
  console.log('🎯 Collaboration Station Task Management loaded');
  console.log('📍 API URL:', window.TASKS_API_URL);
  console.log('⚙️ Configuration:', window.APP_CONFIG);
}