import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export const useNotes = (filter?: string, search?: string) => {
  return useQuery({
    queryKey: ['notes', filter, search],
    queryFn: () => {
      let url = '/notes';
      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      if (search) params.append('search', search);
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      return api.get(url);
    },
  });
};
