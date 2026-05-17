import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export const useProgress = (range: string) => {
  return useQuery({
    queryKey: ['progress', range],
    queryFn: () => api.get(`/dashboard/progress?range=${range}`),
  });
};
