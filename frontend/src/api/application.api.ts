import axiosClient from './axiosClient';
import type { Application } from '../types';

export const applicationApi = {
  create: async (data: {
    scholarshipId: string;
    personalStatement?: string;
    familyIncome?: number;
    academicDetails?: Record<string, unknown>;
  }): Promise<Application> => {
    const res = await axiosClient.post('/applications', data);
    return res.data;
  },

  getAll: async (params?: {
    status?: string;
    scholarshipId?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await axiosClient.get('/applications', { params });
    return res.data;
  },

  getById: async (id: string): Promise<Application> => {
    const res = await axiosClient.get(`/applications/${id}`);
    return res.data;
  },

  update: async (id: string, data: Partial<Application>): Promise<Application> => {
    const res = await axiosClient.put(`/applications/${id}`, data);
    return res.data;
  },

  submit: async (id: string): Promise<{ message: string; application: Application }> => {
    const res = await axiosClient.post(`/applications/${id}/submit`);
    return res.data;
  },

  getMyApplications: async (): Promise<Application[]> => {
    const res = await axiosClient.get('/applications/my');
    return res.data;
  },

  // Document operations
  uploadDocument: async (file: File, applicationId: string, documentType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('applicationId', applicationId);
    formData.append('documentType', documentType);

    const res = await axiosClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  getDocumentSignedUrl: async (docId: string) => {
    const res = await axiosClient.get(`/documents/${docId}/signed-url`);
    return res.data;
  },

  getPendingDocuments: async (params?: { page?: number; limit?: number }) => {
    const res = await axiosClient.get('/documents/pending', { params });
    return res.data;
  },

  reviewDocument: async (docId: string, data: { status: string; remarks?: string }) => {
    const res = await axiosClient.put(`/documents/${docId}/review`, data);
    return res.data;
  },

  // Workflow operations
  takeWorkflowAction: async (
    applicationId: string,
    data: { action: string; stage: string; remarks?: string }
  ) => {
    const res = await axiosClient.post(`/workflow/${applicationId}/action`, data);
    return res.data;
  },

  bulkWorkflowAction: async (data: {
    applicationIds: string[];
    action: string;
    stage: string;
    remarks?: string;
  }) => {
    const res = await axiosClient.post('/workflow/bulk-action', data);
    return res.data;
  },

  getWorkflowHistory: async (applicationId: string) => {
    const res = await axiosClient.get(`/workflow/${applicationId}/history`);
    return res.data;
  },
};
