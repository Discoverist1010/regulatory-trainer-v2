import React, { useState, useEffect } from 'react';
import { Clock, FileText, Upload, BookOpen, Settings, Award } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import { useGameState } from './hooks/useGameState';
import { useAPI } from './hooks/useAPI';
import api from './utils/api';

const languages = {
  en: 'English',
  id: 'Bahasa Indonesia',
  'zh-cn': '简体中文',
  'zh-tw': '繁體中文'
};

function App() {
  const { state, updateState, resetGame } = useGameState();
  const { loading, error, execute } = useAPI();
  const [uploadedFiles, setUploadedFiles] = useState({});

  // Timer for game mode
  useEffect(() => {
    if (state.mode === 'game' && state.timeLeft > 0) {
      const timer = setTimeout(() => {
        updateState({ timeLeft: state.timeLeft - 1 });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.mode, state.timeLeft]);

  const handleFileUpload = async (language, file) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a PDF file');
      return;
    }

    await execute(
      () => api.uploadPDF(file, language, state.sessionTitle),
      (result) => {
        setUploadedFiles(prev => ({
          ...prev,
          [language]: { name: file.name, sessionId: result.sessionId }
        }));
        updateState({ sessionId: result.sessionId });
      }
    );
  };

  const startTrainingSession = async () => {
    const fileInfo = uploadedFiles[state.language];
    if (!fileInfo) {
      alert('Please upload a document for the selected language');
      return;
    }

    await execute(
      () => api.getSession(fileInfo.sessionId),
      (result) => {
        updateState({
          mode: 'game',
          documentContent: result.content,
          timeLeft: 1200
        });
      }
    );
  };

  const submitAnalysis = async () => {
    const submissionData = {
      sessionId: state.sessionId,
      language: state.language,
      submission: state.submission,
      documentContent: state.documentContent
    };

    await execute(
      () => api.analyzeSubmission(submissionData),
      (result) => {
        updateState({
          mode: 'feedback',
          score: result.score,
          feedback: result.feedback
        });
      }
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Home Screen
  if (state.mode === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <FileText className="text-yellow-400" />
              Regulatory Reporter
            </h1>
            <p className="text-xl text-blue-200">Master regulatory newsflash writing</p>
          </div>

          <div className="max-w-md mx-auto mb-8">
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => updateState({ userRole: 'trainer' })}
                className={`flex-1 p-3 rounded-lg transition-colors ${
                  state.userRole === 'trainer' 
                    ? 'bg-yellow-500 text-blue-900' 
                    : 'bg-blue-800 border border-blue-600'
                }`}
              >
                <Settings className="w-5 h-5 mx-auto mb-1" />
                Trainer Setup
              </button>
              <button
                onClick={() => updateState({ userRole: 'student' })}
                className={`flex-1 p-3 rounded-lg transition-colors ${
                  state.userRole === 'student' 
                    ? 'bg-yellow-500 text-blue-900' 
                    : 'bg-blue-800 border border-blue-600'
                }`}
              >
                <BookOpen className="w-5 h-5 mx-auto mb-1" />
                Student Mode
              </button>
            </div>
          </div>

          {state.userRole === 'trainer' && (
            <div className="max-w-2xl mx-auto mb-8 bg-blue-800/50 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Upload className="text-yellow-400" />
                Upload Training Materials
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Session Title</label>
                <input
                  type="text"
                  value={state.sessionTitle}
                  onChange={(e) => updateState({ sessionTitle: e.target.value })}
                  className="w-full p-3 rounded-lg bg-blue-700 border border-blue-600 text-white"
                  placeholder="e.g., Financial Services Regulation 2025"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(languages).map(([code, name]) => (
                  <div key={code} className="bg-blue-700/50 rounded-lg p-4">
                    <label className="block text-sm font-medium mb-2">{name}</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileUpload(code, e.target.files[0])}
                      className="w-full text-sm text-blue-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-blue-900"
                      disabled={loading}
                    />
                    {uploadedFiles[code] && (
                      <div className="mt-2 text-sm text-green-300">
                        ✓ {uploadedFiles[code].name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {state.userRole === 'student' && (
            <>
              <div className="max-w-md mx-auto mb-8">
                <label className="block text-sm font-medium mb-2">Document Language</label>
                <select 
                  value={state.language} 
                  onChange={(e) => updateState({ language: e.target.value })}
                  className="w-full p-3 rounded-lg bg-blue-800 border border-blue-600 text-white"
                >
                  {Object.entries(languages).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="text-center">
                <button 
                  onClick={startTrainingSession}
                  disabled={!uploadedFiles[state.language] || loading}
                  className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-blue-900 font-bold py-4 px-8 rounded-lg text-xl transition-colors"
                >
                  {loading ? 'Loading...' : 'Start Training Session'}
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="max-w-md mx-auto mt-4 p-3 bg-red-600 text-white rounded-lg">
              Error: {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Game Screen
  if (state.mode === 'game') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-blue-900 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">{state.sessionTitle}</h1>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className={`font-mono text-lg ${state.timeLeft < 300 ? 'text-red-300' : ''}`}>
                {formatTime(state.timeLeft)}
              </span>
            </div>
          </div>
        </div>

        <div className="container mx-auto p-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Regulatory Document</h2>
              <div className="bg-gray-50 p-4 rounded border max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">{state.documentContent}</pre>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-2">Write Your Newsflash</h2>
              <p className="text-sm text-blue-600 mb-4 italic">
                Write in English regardless of source document language
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-2">Executive Summary (30-100 words)</label>
                  <textarea
                    value={state.submission.summary}
                    onChange={(e) => updateState({
                      submission: { ...state.submission, summary: e.target.value }
                    })}
                    className="w-full p-3 border rounded-lg h-24 resize-none"
                    placeholder="Write a concise executive summary..."
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    {state.submission.summary.trim().split(/\s+/).filter(w => w.length > 0).length} words
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-2">Client Impact Analysis</label>
                  <textarea
                    value={state.submission.impacts}
                    onChange={(e) => updateState({
                      submission: { ...state.submission, impacts: e.target.value }
                    })}
                    className="w-full p-3 border rounded-lg h-32 resize-none"
                    placeholder="Analyze specific business impacts..."
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2">Document Structure</label>
                  <textarea
                    value={state.submission.structure}
                    onChange={(e) => updateState({
                      submission: { ...state.submission, structure: e.target.value }
                    })}
                    className="w-full p-3 border rounded-lg h-24 resize-none"
                    placeholder="Outline your document structure..."
                  />
                </div>

                <button 
                  onClick={submitAnalysis}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  {loading ? 'Analyzing...' : 'Submit Newsflash'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Feedback Screen
  if (state.mode === 'feedback') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-8">
                <Award className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2">Training Complete!</h1>
                <div className="text-2xl font-bold text-blue-600">
                  Score: {state.score}/100
                </div>
              </div>

              {state.feedback && (
                <div className="space-y-4 mb-8">
                  <h2 className="text-xl font-bold mb-4">AI Teacher Feedback</h2>
                  {state.feedback.items?.map((item, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${
                      item.type === 'good' ? 'bg-green-50 border-green-400' :
                      item.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                      'bg-red-50 border-red-400'
                    }`}>
                      <p className="text-gray-800">{item.text}</p>
                    </div>
                  ))}

                  {state.feedback.improvements && (
                    <div className="bg-blue-50 p-6 rounded-lg mt-6">
                      <h3 className="font-bold mb-3">Specific Improvements</h3>
                      <div className="space-y-2">
                        {state.feedback.improvements.map((improvement, index) => (
                          <div key={index} className="bg-white p-3 rounded border-l-4 border-blue-400">
                            {improvement}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <button 
                  onClick={() => updateState({ mode: 'home' })}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Back to Home
                </button>
                <button 
                  onClick={() => updateState({ mode: 'game', timeLeft: 1200 })}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
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