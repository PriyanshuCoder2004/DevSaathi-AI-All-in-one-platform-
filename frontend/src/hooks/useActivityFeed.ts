import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export const useActivityFeed = () => {
  return useQuery({
    queryKey: ['activity-feed'],
    queryFn: () => api.get('/dashboard/activity-feed'),
  });
};
