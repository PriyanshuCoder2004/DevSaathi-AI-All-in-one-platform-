import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    // Not authenticated
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    const message = error.response?.data?.error || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;
