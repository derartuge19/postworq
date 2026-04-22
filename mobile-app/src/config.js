// API Configuration for mobile app
const getApiConfig = () => {
  // Mobile app will use the same backend as the web app
  return {
    API_BASE_URL: 'https://postworq.onrender.com/api',
    ENVIRONMENT: 'production'
  };
};

const config = getApiConfig();

export default config;
