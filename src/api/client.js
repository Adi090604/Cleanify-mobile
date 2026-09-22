import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
export const AUTH_TOKEN_KEY = 'auth_token';
export const API_TIMEOUT_MS = 15_000;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
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

export function isApiConnectionError(error) {
  return axios.isAxiosError(error) && !error.response;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } finally {
    await clearAuthToken();
  }
}
