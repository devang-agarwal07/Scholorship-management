import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationApi } from '../api/application.api';

export function useMyApplications() {
  return useQuery({
    queryKey: ['my-applications'],
    queryFn: applicationApi.getMyApplications,
  });
}

export function useApplications(params?: {
  status?: string;
  scholarshipId?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['applications', params],
    queryFn: () => applicationApi.getAll(params),
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: applicationApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      applicationApi.update(id, data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['application', vars.id] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });
}

export function useSubmitApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicationApi.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, applicationId, documentType }: {
      file: File;
      applicationId: string;
      documentType: string;
    }) => applicationApi.uploadDocument(file, applicationId, documentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application'] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
    },
  });
}

export function usePendingDocuments(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['pending-documents', params],
    queryFn: () => applicationApi.getPendingDocuments(params),
  });
}

export function useReviewDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ docId, data }: { docId: string; data: { status: string; remarks?: string } }) =>
      applicationApi.reviewDocument(docId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-documents'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export function useWorkflowAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, data }: {
      applicationId: string;
      data: { action: string; stage: string; remarks?: string };
    }) => applicationApi.takeWorkflowAction(applicationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application'] });
    },
  });
}

export function useWorkflowHistory(applicationId: string) {
  return useQuery({
    queryKey: ['workflow-history', applicationId],
    queryFn: () => applicationApi.getWorkflowHistory(applicationId),
    enabled: !!applicationId,
  });
}
