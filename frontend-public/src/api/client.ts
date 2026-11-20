import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

// Use relative paths or environment variable for API URL
const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8080/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('rhconnect_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Log errors for debugging
    console.error('[API Error]', {
      status: error.response?.status,
      url: originalRequest?.url,
      method: originalRequest?.method,
      data: (error.response?.data as any)?.message || error.message,
    });

    // ─── Ne jamais intercepter les endpoints publics d'authentification ───
    // (login, forgot-password, reset-password) : l'erreur doit remonter
    // directement au formulaire sans déclencher de refresh ni de redirect.
    const requestUrl = originalRequest?.url ?? '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password') ||
      requestUrl.includes('/auth/register');

    if (error.response?.status === 401 && isAuthEndpoint) {
      return Promise.reject(error);
    }

    // Only retry on 401, not on 403 (403 means user doesn't have permission)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('rhconnect_refresh_token');

      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('rhconnect_access_token');
        localStorage.removeItem('rhconnect_refresh_token');
        localStorage.removeItem('rhconnect_user');
        // Delay redirect to allow current operations to complete
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 500);
        return Promise.reject(error);
      }

      try {
        const response = await axios.post<RefreshTokenResponse>(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken },
          { withCredentials: false }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        localStorage.setItem('rhconnect_access_token', accessToken);
        localStorage.setItem('rhconnect_refresh_token', newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        processQueue(null, accessToken);
        return client(originalRequest);
      } catch (refreshError) {
        console.error('[Refresh Token Error]', refreshError);
        processQueue(refreshError, null);
        localStorage.removeItem('rhconnect_access_token');
        localStorage.removeItem('rhconnect_refresh_token');
        localStorage.removeItem('rhconnect_user');
        // Delay redirect to allow current operations to complete
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 500);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Don't retry on 403 - it means the user doesn't have permission
    if (error.response?.status === 403) {
      console.warn('[Authorization Error] User does not have permission for this resource');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default client;
