import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/ui/ToastProvider';

export const useGenerateNotes = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (data: any) => api.post('/notes/generate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      showToast('Notes generated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to generate notes', 'error');
    }
  });
};

export const useNote = (id: string) => {
  return useQuery({
    queryKey: ['note', id],
    queryFn: () => api.get(`/notes/${id}`),
    enabled: !!id && id !== 'new'
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (data: any) => api.post('/notes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      showToast('Note created successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create note', 'error');
    }
  });
};

export const useUpdateNote = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/notes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      showToast('Note updated successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update note', 'error');
    }
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      showToast('Note deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to delete note', 'error');
    }
  });
};

export const useGetUploadUrl = () => {
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (data: { filename: string; size: number }) => 
      api.post('/docs/upload-url', data),
    onError: (error: any) => {
      showToast(error.message || 'Failed to get upload URL', 'error');
    }
  });
};

export const useSummarizeDoc = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (data: { s3Key: string; filename: string; language?: string }) => 
      api.post('/docs/summarize', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['docs-history'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      showToast('Document summarized successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to summarize document', 'error');
    }
  });
};
export const useDocSummary = (id: string) => {
  return useQuery({
    queryKey: ['doc-summary', id],
    queryFn: () => api.get(`/docs/summary/${id}`),
    enabled: !!id && id !== 'new'
  });
};
