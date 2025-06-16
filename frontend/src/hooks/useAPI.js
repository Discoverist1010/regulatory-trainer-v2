import { useState, useCallback } from 'react';
import api from '../utils/api';

export function useAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const execute = useCallback(async (apiCall, onSuccess, options = {}) => {
    const { 
      retries = 2, 
      retryDelay = 1000, 
      showProgress = false,
      timeout = 30000 
    } = options;

    setLoading(true);
    setError(null);
    if (showProgress) setProgress(0);
    
    let lastError;
    
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        if (showProgress) {
          setProgress(20); // Starting request
        }

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeout);
        });

        // Race between API call and timeout
        const result = await Promise.race([
          apiCall(),
          timeoutPromise
        ]);

        if (showProgress) {
          setProgress(80);
        }

        if (onSuccess) {
          await onSuccess(result);
        }

        if (showProgress) {
          setProgress(100);
          setTimeout(() => setProgress(0), 1000);
        }

        return result;

      } catch (err) {
        lastError = err;
        console.error(`API attempt ${attempt} failed:`, err);

        // Don't retry on certain errors
        if (err.status === 400 || err.status === 401 || err.status === 403) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt <= retries) {
          await new Promise(resolve => 
            setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
          );
        }
      }
    }

    // All attempts failed
    const errorMessage = getErrorMessage(lastError);
    setError(errorMessage);
    throw new Error(errorMessage);
    
  }, []);

  const uploadFile = useCallback(async (file, language, sessionTitle, onProgress) => {
    return execute(
      () => api.uploadPDF(file, language, sessionTitle),
      onProgress,
      { showProgress: true, timeout: 60000 }
    );
  }, [execute]);

  const analyzeSubmission = useCallback(async (submissionData, onComplete) => {
    return execute(
      () => api.analyzeSubmission(submissionData),
      onComplete,
      { showProgress: true, timeout: 45000 }
    );
  }, [execute]);

  const getSession = useCallback(async (sessionId, onSuccess) => {
    return execute(
      () => api.getSession(sessionId),
      onSuccess,
      { retries: 1, timeout: 15000 }
    );
  }, [execute]);

  const healthCheck = useCallback(async () => {
    return execute(
      () => api.healthCheck(),
      null,
      { retries: 0, timeout: 5000 }
    );
  }, [execute]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setProgress(0);
  }, []);

  return {
    loading,
    error,
    progress,
    execute,
    uploadFile,
    analyzeSubmission,
    getSession,
    healthCheck,
    clearError,
    reset
  };
}

// Helper function to format error messages
function getErrorMessage(error) {
  if (!error) return 'Unknown error occurred';
  
  // Network errors
  if (error.message === 'Request timeout') {
    return 'Request timed out. Please check your connection and try again.';
  }
  
  if (error.message === 'Failed to fetch' || error.name === 'NetworkError') {
    return 'Network error. Please check your internet connection.';
  }

  // API errors
  if (error.status) {
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication failed. Please refresh the page.';
      case 403:
        return 'Access denied. You don\'t have permission for this action.';
      case 404:
        return 'Resource not found. The session may have expired.';
      case 413:
        return 'File too large. Please upload a smaller PDF (max 10MB).';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again in a few minutes.';
      case 503:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return `Error ${error.status}: ${error.message || 'Request failed'}`;
    }
  }

  // Claude API specific errors
  if (error.message.includes('Claude')) {
    return 'AI analysis service temporarily unavailable. Basic feedback will be provided.';
  }

  // File processing errors
  if (error.message.includes('PDF')) {
    return 'Failed to process PDF. Please ensure it\'s a valid PDF file with text content.';
  }

  // Generic error
  return error.message || 'An unexpected error occurred. Please try again.';
}