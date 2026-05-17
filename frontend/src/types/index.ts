export interface User {
  id: string; name: string; email: string;
  plan: 'free' | 'pro'; language: 'en' | 'hi';
  level: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string; streak: number; lastActive: string;
  isVerified: boolean;
  avatar?: string;
  notifications?: { email: boolean; push: boolean };
}

export interface UserStats {
  topicsLearned: number; quizzesCompleted: number;
  averageScore: number; notesSaved: number; streak: number;
  totalTimeSpent: number;
}

export interface TopicExplanation {
  id: string; topic: string; explanation: string;
  codeExample?: string; codeLanguage?: string;
  realLifeExample: string; subtopics: string[];
  keyTakeaway: string; createdAt: string;
}

export interface QuizQuestion {
  id: string; question: string;
  options: string[]; correctIndex: number; explanation: string;
}

export interface QuizResult {
  id: string; topicId: string; topic: string;
  score: number; totalQuestions: number;
  answers: { questionId: string; selectedIndex: number; correct: boolean }[];
  timeTaken: number; completedAt: string;
}

export interface Note {
  id: string; userId: string; title: string;
  content: string; topic: string; tags: string[];
  isAI: boolean; wordCount: number;
  createdAt: string; updatedAt: string;
}

export interface Bug {
  severity: 'critical' | 'moderate' | 'minor';
  title: string; description: string; fix: string; lineNumbers?: number[];
}

export interface Improvement {
  category: 'Performance' | 'Readability' | 'Best Practice' | 'Security';
  suggestion: string; benefit: string; priority: 'high' | 'medium' | 'low';
}

export interface CodeAnalysis {
  detectedLanguage: string; explanation: string;
  keyConcepts: { name: string; description: string }[];
  logicFlow: { step: number; title: string; description: string }[];
  isValid: boolean; bugs?: Bug[]; improvements?: Improvement[];
}

export interface DocSummary {
  id: string; filename: string; fileSize: number;
  title: string; sections: { heading: string; content: string }[];
  keyPoints: string[]; warnings: { label: string; description: string }[];
  readTime: number; pageCount: number; createdAt: string;
}

export interface DailyActivity { date: string; count: number; }

export interface TopicProgress {
  topic: string; timesPracticed: number;
  bestScore: number; latestScore: number; trend: 'up' | 'down' | 'stable';
}
