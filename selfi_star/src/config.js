// API Configuration for different environments
const getApiConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Check if we're on Vercel
  const isVercel = window.location.hostname.includes('vercel.app');
  
  if (isVercel || isProduction) {
    return {
      API_BASE_URL: 'https://your-backend-domain.com/api', // We'll update this after backend deployment
      ENVIRONMENT: 'production'
    };
  } else {
    return {
      API_BASE_URL: 'http://localhost:8000/api',
      ENVIRONMENT: 'development'
    };
  }
};

const config = getApiConfig();

export default config;
