import axios from 'axios';

const isDevelopment = process.env.NODE_ENV === 'development';

export const instance = axios.create({
  baseURL: isDevelopment 
    ? 'http://localhost:5001/gameseru/asia-southeast1/api'  // Local Firebase emulator
    : 'https://asia-southeast1-gameseru.cloudfunctions.net/api', // Production
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor
instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('idToken');
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor
instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      return Promise.reject(error);
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', error.request);
      return Promise.reject({
        response: {
          data: {
            general: 'Network error: Unable to reach server'
          }
        }
      });
    } else {
      // Something else happened in setting up the request
      console.error('Error:', error.message);
      return Promise.reject({
        response: {
          data: {
            general: 'Error setting up the request'
          }
        }
      });
    }
  }
);