import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export const useQuizHistory = () => {
  return useQuery({
    queryKey: ['quiz-history'],
    queryFn: () => api.get('/quiz/history'),
  });
};
