import { api } from './api';
import type { LoginResponse, User } from '@/types';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authApi = {
  register: (input: RegisterInput) =>
    api.post<LoginResponse>('/auth/register', input),

  login: (input: LoginInput) =>
    api.post<LoginResponse>('/auth/login', input),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      refreshToken,
    }),

  logout: (refreshToken?: string) =>
    api.post('/auth/logout', { refreshToken }),

  getProfile: () =>
    api.get<User>('/auth/profile'),
};
