import axiosClient from './axiosClient';
import type { ReportSummary } from '../types';

export const reportApi = {
  getSummary: async (): Promise<ReportSummary> => {
    const res = await axiosClient.get('/reports/summary');
    return res.data;
  },

  getApplicationsReport: async (params?: {
    scholarshipId?: string;
    status?: string;
    academicYear?: string;
    format?: 'json' | 'csv' | 'pdf';
  }) => {
    const config = params?.format === 'csv' || params?.format === 'pdf'
      ? { params, responseType: 'blob' as const }
      : { params };

    const res = await axiosClient.get('/reports/applications', config);
    return res.data;
  },

  getDisbursementReport: async (params?: {
    academicYear?: string;
    format?: 'json' | 'csv' | 'pdf';
  }) => {
    const config = params?.format === 'csv' || params?.format === 'pdf'
      ? { params, responseType: 'blob' as const }
      : { params };

    const res = await axiosClient.get('/reports/disbursement', config);
    return res.data;
  },

  getPendingActions: async () => {
    const res = await axiosClient.get('/reports/pending-actions');
    return res.data;
  },
};

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
