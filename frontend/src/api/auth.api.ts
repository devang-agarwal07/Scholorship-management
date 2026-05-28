import axiosClient from './axiosClient';
import type { AuthResponse, User, Profile } from '../types';

export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<AuthResponse> => {
    const res = await axiosClient.post('/auth/register', data);
    return res.data;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResponse> => {
    const res = await axiosClient.post('/auth/login', data);
    return res.data;
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const res = await axiosClient.post('/auth/refresh', { refreshToken });
    return res.data;
  },

  logout: async (): Promise<void> => {
    await axiosClient.post('/auth/logout');
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await axiosClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const res = await axiosClient.post('/auth/reset-password', { token, password });
    return res.data;
  },

  getProfile: async (): Promise<User> => {
    const res = await axiosClient.get('/auth/profile');
    return res.data;
  },

  updateProfile: async (data: Partial<Profile>): Promise<Profile> => {
    const res = await axiosClient.put('/auth/profile', data);
    return res.data;
  },
};
