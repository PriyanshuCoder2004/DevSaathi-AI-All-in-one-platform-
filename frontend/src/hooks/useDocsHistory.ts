import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export const useDocsHistory = () => {
  return useQuery({
    queryKey: ['docs-history'],
    queryFn: () => api.get('/docs/history'),
  });
};
