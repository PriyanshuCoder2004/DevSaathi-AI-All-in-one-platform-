import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { useToast } from '../components/ui/ToastProvider';

export const useExplainTopic = () => {
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (data: { topic: string; language: string }) => 
      api.post('/explain', data),
    onError: (error: any) => {
      showToast(error.message || 'Failed to explain topic', 'error');
    }
  });
};

export const useGenerateQuiz = () => {
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (data: { topic: string; explanation: string; count?: number }) => 
      api.post('/quiz/generate', data),
    onError: (error: any) => {
      showToast(error.message || 'Failed to generate quiz', 'error');
    }
  });
};

export const useEvaluateQuiz = () => {
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (data: { answers: any[]; timeTaken: number }) => 
      api.post('/quiz/evaluate', data),
    onError: (error: any) => {
      showToast(error.message || 'Failed to evaluate quiz', 'error');
    }
  });
};

export const useSaveQuiz = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (data: any) => api.post('/quiz/save', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-history'] });
      showToast('Quiz saved successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to save quiz', 'error');
    }
  });
};
export const useFollowUpQuestion = () => {
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (data: { topic: string; currentExplanation: string; question: string; language: string }) => 
      api.post('/followup', data),
    onError: (error: any) => {
      showToast(error.message || 'Failed to get answer for follow-up', 'error');
    }
  });
};
