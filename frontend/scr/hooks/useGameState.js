import { useState, useEffect } from 'react';

const initialState = {
  mode: 'home', // 'home', 'trainer', 'student', 'game', 'feedback'
  language: 'en',
  userRole: 'student',
  sessionId: null,
  sessionTitle: '',
  documentContent: '',
  submission: {
    summary: '',
    impacts: '',
    structure: ''
  },
  timeLeft: 1200, // 20 minutes
  score: 0,
  feedback: null
};

export function useGameState() {
  const [state, setState] = useState(() => {
    // Restore from localStorage
    try {
      const saved = localStorage.getItem('regulatory-trainer-state');
      return saved ? { ...initialState, ...JSON.parse(saved) } : initialState;
    } catch {
      return initialState;
    }
  });

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('regulatory-trainer-state', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save state:', error);
    }
  }, [state]);

  const updateState = (updates) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const resetGame = () => {
    setState(prev => ({
      ...initialState,
      language: prev.language,
      userRole: prev.userRole
    }));
  };

  return { state, updateState, resetGame };
}