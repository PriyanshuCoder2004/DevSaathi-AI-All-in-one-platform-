import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/ToastProvider';

export const useUpdatePreferences = () => {
  const { updateUser } = useAuth();
  const { showToast } = useToast();
  return useMutation({
    mutationFn: (preferences: any) => api.patch('/user/preferences', preferences),
    onSuccess: (data: any) => {
      if (data && typeof data === 'object') {
        updateUser(data);
      }
      showToast('Preferences updated', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to update preferences', 'error');
    }
  });
};
