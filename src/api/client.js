import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = 'http://192.168.1.5:8000/api/v1';
export const AUTH_TOKEN_KEY = 'auth_token';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function clearAuthToken() {
  return SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}

export function getAuthToken() {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    await clearAuthToken();
  }
}
