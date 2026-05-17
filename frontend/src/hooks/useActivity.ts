import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export const useActivity = () => {
  return useQuery({
    queryKey: ['activity'],
    queryFn: () => api.get('/dashboard/activity'),
  });
};
