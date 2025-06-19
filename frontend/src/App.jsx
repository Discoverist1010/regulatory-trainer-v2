import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import TrainerUpload from './components/TrainerUpload';
import StudentTraining from './components/StudentTraining';
import FeedbackView from './components/FeedbackView';
import api from './utils/api';

function App() {
  const [mode, setMode] = useState('home'); // home, trainer, student, feedback
  const [session, setSession] = useState(null);
  const [feedbackData, setFeedbackData] = useState(null);

  const handleSessionCreate = async (sessionData) => {
    setSession(sessionData);
    // Show success message
    alert('Training session created successfully!');
    // Switch to student view to preview
    setMode('student');
    
    // Load the document content
    try {
      const result = await api.getSession(sessionData.sessionId);
      setSession({
        ...sessionData,
        documentContent: result.content
      });
    } catch (error) {
      console.error('Error loading session:', error);
      alert('Error loading session content');
    }
  };

  const handleSubmission = async (submission) => {
    try {
      const response = await api.analyzeSubmission({
        sessionId: session.sessionId,
        language: session.language,
        submission,
        documentContent: session.documentContent
      });

      setFeedbackData({
        score: response.score,
        feedback: response.feedback,
        submission,
        professionalExample: response.professionalExample
      });
      setMode('feedback');
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Error analyzing submission: ' + error.message);
    }
  };

  const handleTimeout = () => {
    alert('Time is up! Submitting your work...');
    // Auto-submit logic here if needed
  };

  const resetToHome = () => {
    setMode('home');
    setSession(null);
    setFeedbackData(null);
  };

  const startNewSession = () => {
    setMode('trainer');
    setFeedbackData(null);
  };

  // Home Screen
  if (mode === 'home') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <FileText className="w-12 h-12 text-blue-500" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-green-400 
              bg-clip-text text-transparent">
              RegTrainer Pro
            </h1>
          </div>
          <p className="text-xl text-gray-400 mb-12">Master regulatory newsflash writing</p>
          
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setMode('trainer')}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                transition-all hover:shadow-lg font-medium text-lg"
            >
              Trainer Mode
            </button>
            <button
              onClick={() => setMode('student')}
              className="px-8 py-4 border border-gray-600 text-gray-300 rounded-lg 
                hover:bg-gray-800 transition-all font-medium text-lg"
            >
              Student Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Trainer Upload Screen
  if (mode === 'trainer') {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <button
            onClick={resetToHome}
            className="mb-6 text-gray-400 hover:text-gray-200 transition-colors"
          >
            ← Back to Home
          </button>
          <TrainerUpload onSessionCreate={handleSessionCreate} api={api} />
        </div>
      </div>
    );
  }

  // Student Training Screen
  if (mode === 'student' && session) {
    return (
      <StudentTraining
        session={session}
        onSubmit={handleSubmission}
        onTimeout={handleTimeout}
      />
    );
  }

  // Feedback Screen
  if (mode === 'feedback' && feedbackData) {
    return (
      <FeedbackView
        score={feedbackData.score}
        feedback={feedbackData.feedback}
        submission={feedbackData.submission}
        professionalExample={feedbackData.professionalExample}
        onClose={resetToHome}
        onRetry={startNewSession}
      />
    );
  }

  // Default student mode message
  if (mode === 'student' && !session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-6">No active training session</p>
          <button
            onClick={resetToHome}
            className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 
              transition-colors font-medium"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

export default AppWithErrorBoundary;