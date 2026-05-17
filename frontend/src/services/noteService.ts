
import { incrementNotesSaved } from './statsService';

export interface Note {
  id: string;
  title: string;
  content: string;
  topic: string;
  isAI: boolean;
  isBookmarked: boolean;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
}

const getStorageKey = () => {
  const user = JSON.parse(localStorage.getItem('devsaathi_user') || '{}');
  const suffix = user.email ? `_${user.email}` : '';
  return `devsaathi_notes${suffix}`;
};

export const getNotes = (): Note[] => {
  try {
    const STORAGE_KEY = getStorageKey();
    const oldKey = 'devsaathi_notes';
    
    let stored = localStorage.getItem(STORAGE_KEY);
    
    // MIGRATION: If new key is empty but old key has data, migrate it
    if (!stored) {
      const oldData = localStorage.getItem(oldKey);
      if (oldData && oldData !== 'undefined' && oldData !== 'null') {
        localStorage.setItem(STORAGE_KEY, oldData);
        stored = oldData;
        // Optionally keep old data for safety or remove it: localStorage.removeItem(oldKey);
      }
    }
    if (!stored || stored === 'undefined' || stored === 'null') {
      return [
        {
          id: '1',
          title: 'Advanced Asyncio Patterns',
          content: 'Exploring concurrency models and event loop management for high-performance Python applications...',
          topic: 'PYTHON',
          isAI: false,
          isBookmarked: false,
          wordCount: 450,
          createdAt: 'Oct 24, 2023',
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Graph Traversal Optimization',
          content: 'Optimizing BFS and DFS for large-scale social network analysis using advanced pruning...',
          topic: 'ALGORITHMS',
          isAI: true,
          isBookmarked: false,
          wordCount: 1280,
          createdAt: 'Oct 22, 2023',
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Custom Hook Lifecycle',
          content: 'Understanding the dependency array and closure staleness in complex state management...',
          topic: 'REACT',
          isAI: false,
          isBookmarked: false,
          wordCount: 620,
          createdAt: 'Oct 20, 2023',
          updatedAt: new Date().toISOString()
        }
      ];
    }
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error parsing notes:', e);
    return [];
  }
};

export const saveNote = (note: Note) => {
  const notes = getNotes();
  const index = notes.findIndex(n => n.id === note.id);
  
  if (index >= 0) {
    notes[index] = { ...note, updatedAt: new Date().toISOString() };
  } else {
    notes.unshift({ ...note, createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), updatedAt: new Date().toISOString() });
    incrementNotesSaved(note.topic);
  }
  
  localStorage.setItem(getStorageKey(), JSON.stringify(notes));
  return note;
};

export const deleteNote = (id: string) => {
  const notes = getNotes();
  const filtered = notes.filter(n => n.id !== id);
  localStorage.setItem(getStorageKey(), JSON.stringify(filtered));
};

export const getNoteById = (id: string): Note | undefined => {
  return getNotes().find(n => n.id === id);
};
