import axios from 'axios';

// Default to local development API if environment variable isn't set
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Log API URL in development to help with debugging
if (process.env.NODE_ENV !== 'production') {
  console.log('API URL:', API_URL);
}

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Only execute in browser environment
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Log request URL in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.log('API Request:', config.method?.toUpperCase(), `${config.baseURL ?? ''}${config.url}`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle authentication errors
    if (error.response) {
      const { status } = error.response;
      
      // Handle token expiration
      if (status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          // Don't force redirect here - let the components handle this
          console.log('Session expired. Please reconnect your wallet.');
        }
      }
      
      // Create more user-friendly error message
      const message = error.response.data?.error || 
                     error.response.data?.message || 
                     'An error occurred with the request';
      
      error.friendlyMessage = message;
    } else if (error.request) {
      // Request was made but no response received (network error)
      error.friendlyMessage = 'Network error. Please check your connection.';
    } else {
      error.friendlyMessage = 'An unexpected error occurred.';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;