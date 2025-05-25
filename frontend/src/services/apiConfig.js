const API_URL = 'http://192.168.88.29:5000/api';

export const getApiUrl = (endpoint = '') => {
  // Use environment variable if available
  if (process.env.API_URL) {
    return `${process.env.API_URL}/api${endpoint}`;
  }
  
  // Default development URL
  return `${API_URL}${endpoint}`;
};