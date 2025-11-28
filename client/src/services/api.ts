import axios from 'axios';
import type { User, AuthResponse, RegisterRequest } from '../../../shared/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  async register(data: Omit<RegisterRequest, 'deviceFingerprint'>): Promise<AuthResponse> {
    const deviceFingerprint = await getDeviceFingerprint();
    const response = await api.post<AuthResponse>('/auth/register', {
      ...data,
      deviceFingerprint,
    });
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const deviceFingerprint = await getDeviceFingerprint();
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
      deviceFingerprint,
    });
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getMe(): Promise<{ user: User }> {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data;
  },
};

// Generate device fingerprint
async function getDeviceFingerprint(): Promise<string> {
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const platform = navigator.platform;
  const data = `${userAgent}-${language}-${platform}`;
  
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

export default api;
