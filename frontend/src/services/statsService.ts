import api from './api';

export interface UserStats {
  topicsLearned: number;
  quizzesCompleted: number;
  averageScore: number;
  notesSaved: number;
  streak: number;
}

export const getStats = async (): Promise<UserStats> => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

export const getActivityFeed = async () => {
  const response = await api.get('/dashboard/activity-feed');
  return response.data;
};

export const getRecentTopics = async () => {
  const response = await api.get('/dashboard/recent');
  return response.data;
};

export const getProgress = async (range: string = '7d') => {
  const response = await api.get(`/dashboard/progress?range=${range}`);
  return response.data;
};

export const addLearnedTopic = async (topicTitle: string) => {
  // The backend explainTopic call already handles saving the topic
};

export const addQuizResult = async (data: any) => {
  const response = await api.post('/quiz/save', data);
  return response.data;
};

export const incrementNotesSaved = async (topic?: string) => {
  // This is a placeholder for a backend call to increment stats
  console.log('Incrementing notes saved for topic:', topic);
};
