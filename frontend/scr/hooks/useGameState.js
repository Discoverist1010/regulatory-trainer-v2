import { useState, useEffect } from 'react';

const initialState = {
  mode: 'home', // 'home', 'trainer', 'student', 'game', 'feedback'
  language: 'en', // Document language
  interfaceLanguage: 'en', // UI language
  userRole: 'student', // 'trainer' or 'student'
  sessionId: null,
  sessionTitle: '',
  documentContent: '',
  submission: {
    summary: '',
    impacts: '',
    structure: ''
  },
  timeLeft: 1200, // 20 minutes in seconds
  score: 0,
  feedback: null,
  uploadProgress: {},
  gameStartTime: null,
  gameEndTime: null,
  sessionHistory: []
};

export function useGameState() {
  const [state, setState] = useState(() => {
    // Restore from localStorage with version check
    try {
      const saved = localStorage.getItem('regulatory-trainer-state');
      const savedData = saved ? JSON.parse(saved) : {};
      
      // Merge with initial state to handle new fields
      return {
        ...initialState,
        ...savedData,
        // Always reset certain fields on page load
        mode: 'home',
        timeLeft: savedData.timeLeft || 1200,
        feedback: null
      };
    } catch (error) {
      console.warn('Failed to restore state:', error);
      return initialState;
    }
  });

  // Auto-save to localStorage (debounced)
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      try {
        // Only save certain fields to localStorage
        const stateToSave = {
          language: state.language,
          interfaceLanguage: state.interfaceLanguage,
          userRole: state.userRole,
          sessionId: state.sessionId,
          sessionTitle: state.sessionTitle,
          documentContent: state.documentContent,
          submission: state.submission,
          timeLeft: state.timeLeft,
          uploadProgress: state.uploadProgress,
          sessionHistory: state.sessionHistory.slice(-10) // Keep last 10 sessions
        };
        
        localStorage.setItem('regulatory-trainer-state', JSON.stringify(stateToSave));
      } catch (error) {
        console.warn('Failed to save state:', error);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(saveTimeout);
  }, [state]);

  const updateState = (updates) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      
      // Auto-calculate derived values
      if (updates.mode === 'game' && prev.mode !== 'game') {
        newState.gameStartTime = Date.now();
      }
      
      if (updates.mode === 'feedback' && prev.mode === 'game') {
        newState.gameEndTime = Date.now();
        
        // Add to session history
        const sessionRecord = {
          id: prev.sessionId,
          title: prev.sessionTitle,
          language: prev.language,
          score: updates.score || 0,
          timeUsed: 1200 - prev.timeLeft,
          completedAt: new Date().toISOString(),
          submission: prev.submission
        };
        
        newState.sessionHistory = [
          ...(prev.sessionHistory || []),
          sessionRecord
        ].slice(-10); // Keep last 10 sessions
      }
      
      return newState;
    });
  };

  const resetGame = () => {
    setState(prev => ({
      ...initialState,
      // Preserve user preferences
      language: prev.language,
      interfaceLanguage: prev.interfaceLanguage,
      userRole: prev.userRole,
      sessionHistory: prev.sessionHistory,
      uploadProgress: prev.uploadProgress
    }));
  };

  const startNewSession = (sessionData) => {
    updateState({
      mode: 'game',
      sessionId: sessionData.sessionId,
      documentContent: sessionData.content,
      timeLeft: 1200,
      submission: { summary: '', impacts: '', structure: '' },
      gameStartTime: Date.now(),
      gameEndTime: null,
      feedback: null,
      score: 0
    });
  };

  const updateSubmission = (field, value) => {
    updateState({
      submission: {
        ...state.submission,
        [field]: value
      }
    });
  };

  const getSessionStats = () => {
    const history = state.sessionHistory || [];
    if (history.length === 0) return null;

    const totalSessions = history.length;
    const averageScore = history.reduce((sum, session) => sum + (session.score || 0), 0) / totalSessions;
    const bestScore = Math.max(...history.map(s => s.score || 0));
    const averageTime = history.reduce((sum, session) => sum + (session.timeUsed || 0), 0) / totalSessions;

    return {
      totalSessions,
      averageScore: Math.round(averageScore),
      bestScore,
      averageTime: Math.round(averageTime),
      recentSessions: history.slice(-5).reverse()
    };
  };

  const clearHistory = () => {
    updateState({
      sessionHistory: []
    });
  };

  // Helper function to check if submission is complete
  const isSubmissionComplete = () => {
    const { summary, impacts, structure } = state.submission;
    const summaryWords = summary.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    return (
      summaryWords >= 30 && summaryWords <= 100 &&
      impacts.trim().length > 50 &&
      structure.trim().length > 20
    );
  };

  // Helper function to get submission progress
  const getSubmissionProgress = () => {
    const { summary, impacts, structure } = state.submission;
    const summaryWords = summary.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    const checks = {
      summary: summaryWords >= 30 && summaryWords <= 100,
      impacts: impacts.trim().length > 50,
      structure: structure.trim().length > 20
    };

    const completed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;

    return {
      checks,
      completed,
      total,
      percentage: Math.round((completed / total) * 100)
    };
  };

  return { 
    state, 
    updateState, 
    resetGame,
    startNewSession,
    updateSubmission,
    getSessionStats,
    clearHistory,
    isSubmissionComplete,
    getSubmissionProgress
  };
}