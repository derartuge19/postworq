// API Configuration for different environments
const getApiConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Check if we're on Vercel or localhost
  const hostname = window.location.hostname;
  const isVercel = hostname.includes('vercel.app');
  const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  
  if (isVercel) {
    return {
      API_BASE_URL: 'https://selfi-star-backend.railway.app/api', // Update after backend deployment
      ENVIRONMENT: 'production'
    };
  } else if (isLocalhost) {
    return {
      API_BASE_URL: 'http://localhost:8000/api',
      ENVIRONMENT: 'development'
    };
  } else {
    return {
      API_BASE_URL: 'https://selfi-star-backend.railway.app/api', // Fallback
      ENVIRONMENT: 'production'
    };
  }
};

const config = getApiConfig();

export default config;
