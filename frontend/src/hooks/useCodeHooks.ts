import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/ui/ToastProvider';

export const useExplainCode = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (data: any) => api.post('/code/explain', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to explain code', 'error');
    }
  });
};

export const useDebugCode = () => {
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (data: any) => api.post('/code/debug', data),
    onError: (error: any) => {
      showToast(error.message || 'Failed to debug code', 'error');
    }
  });
};

export const useImproveCode = () => {
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (data: any) => api.post('/code/improve', data),
    onError: (error: any) => {
      showToast(error.message || 'Failed to improve code', 'error');
    }
  });
};
