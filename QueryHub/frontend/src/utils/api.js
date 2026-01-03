import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 20000, // 20 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    const userInfoStr = localStorage.getItem('userInfo');
    
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        if (userInfo && userInfo.token) {
          config.headers.Authorization = `Bearer ${userInfo.token}`;
        }
      } catch (error) {
        console.error('Error parsing user info:', error);
        localStorage.removeItem('userInfo');
      }
    }
    
    console.log(`API ${config.method.toUpperCase()}: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`API Error ${error.response.status}:`, {
        url: error.config?.url,
        status: error.response.status,
        message: error.response.data?.message
      });
      
      if (error.response.status === 401) {
        console.log('Unauthorized - Removing token');
        localStorage.removeItem('userInfo');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
      alert('Request timeout. Server might be slow.');
    } else if (error.message === 'Network Error') {
      console.error('Network error - Backend might not be running');
      alert('⚠️ Backend server not found. Please make sure backend is running on http://localhost:5000');
    }
    
    return Promise.reject(error);
  }
);

export default API;