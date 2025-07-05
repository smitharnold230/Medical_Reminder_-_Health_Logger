// Configuration loader for the frontend
// This simulates loading from environment.env file
// In a real production app, you'd use a build-time configuration

const loadConfig = () => {
  // For development, we'll use the values from environment.env
  // In production, these would be set during build time
  return {
    API_BASE_URL: 'http://localhost:5000/api',
    ENVIRONMENT: 'development',
    ENABLE_ANALYTICS: false,
    ENABLE_DEBUG_MODE: true,
    // Add any other configuration values here
  };
};

export const config = loadConfig();

export default config; 