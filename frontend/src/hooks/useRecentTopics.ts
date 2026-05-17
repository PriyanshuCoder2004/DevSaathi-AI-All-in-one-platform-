import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export const useRecentTopics = () => {
  return useQuery({
    queryKey: ['recent-topics'],
    queryFn: () => api.get('/dashboard/recent'),
  });
};
