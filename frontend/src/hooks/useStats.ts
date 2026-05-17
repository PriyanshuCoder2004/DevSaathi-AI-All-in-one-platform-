import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export const useStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get('/dashboard/stats'),
    refetchOnWindowFocus: false,
  });
};
