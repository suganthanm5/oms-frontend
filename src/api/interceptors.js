import { getCookie, deleteCookie } from '../utils/cookieUtils';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const clearAuth = () => {
  deleteCookie('token');
  deleteCookie('user');
  deleteCookie('username');
  deleteCookie('email');
  deleteCookie('role');
  deleteCookie('outletId');
};

export const setupInterceptors = (axiosInstance) => {
  // Request Interceptor
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getCookie('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
      config.metadata = { startTime: new Date() };
      return config;
    },
    (error) => {
      console.error('Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response Interceptor
  axiosInstance.interceptors.response.use(
    (response) => {
      if (response.config.metadata) {
        response.duration = new Date() - response.config.metadata.startTime;
      }
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Network Error
      if (!error.response) {
        console.error('Network Error:', error.message);
        return Promise.reject(error);
      }

      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        if (originalRequest._retry) {
          clearAuth();
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
          return Promise.reject(error);
        }

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          }).catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        clearAuth();
        processQueue(error, null);
        isRefreshing = false;
        
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
        return Promise.reject(error);
      }

      // Handle 403 Forbidden
      if (error.response.status === 403) {
        console.error('Access Denied:', error.response.data?.message);
      }

      // Handle 404 Not Found
      if (error.response.status === 404) {
        console.warn('Resource not found:', error.response.data?.message);
      }

      // Handle 500 Server Error
      if (error.response.status >= 500) {
        console.error('Server Error:', error.response.status);
      }

      // Return original error to preserve error.response structure
      return Promise.reject(error);
    }
  );
};
