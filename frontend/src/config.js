// Configuration loader for the frontend
// This simulates loading from environment.env file
// In a real production app, you'd use a build-time configuration

const loadConfig = () => {
  // Check if we're in production (you can set this via environment variable during build)
  const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname !== 'localhost';
  
  // For development, use localhost
  // For production, use your Render backend URL
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ||
    (isProduction
      ? 'https://medical-reminder-health-logger-306x.onrender.com/api'
      : 'http://localhost:5000/api');
  
  return {
    API_BASE_URL,
    ENVIRONMENT: isProduction ? 'production' : 'development',
    ENABLE_ANALYTICS: isProduction,
    ENABLE_DEBUG_MODE: !isProduction,
    // Add any other configuration values here
  };
};

export const config = loadConfig();

export default config; 
