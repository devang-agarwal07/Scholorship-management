import axiosClient from './axiosClient';
import type { Scholarship } from '../types';

export const scholarshipApi = {
  getAll: async (params?: {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const res = await axiosClient.get('/scholarships', { params });
    return res.data;
  },

  getById: async (id: string): Promise<Scholarship> => {
    const res = await axiosClient.get(`/scholarships/${id}`);
    return res.data;
  },

  create: async (data: Partial<Scholarship>): Promise<Scholarship> => {
    const res = await axiosClient.post('/scholarships', data);
    return res.data;
  },

  update: async (id: string, data: Partial<Scholarship>): Promise<Scholarship> => {
    const res = await axiosClient.put(`/scholarships/${id}`, data);
    return res.data;
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const res = await axiosClient.delete(`/scholarships/${id}`);
    return res.data;
  },

  checkEligibility: async (id: string): Promise<{ eligible: boolean; reasons: string[] }> => {
    const res = await axiosClient.get(`/scholarships/${id}/eligibility`);
    return res.data;
  },
};
