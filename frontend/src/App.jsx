import React, { useState, useEffect } from 'react';
import { Clock, FileText, Upload, BookOpen, Settings, Award, CheckCircle, AlertCircle, Globe } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import { useGameState } from './hooks/useGameState';
import { useAPI } from './hooks/useAPI';
import api from './utils/api';

// Simplified translations - keeping only English for now to reduce complexity
const translations = {
  en: {
    appTitle: "Regulatory Reporter",
    appSubtitle: "Master regulatory newsflash writing",
    trainerSetup: "Trainer Setup",
    studentMode: "Student Mode",
    uploadMaterials: "Upload Training Materials",
    sessionTitle: "Session Title",
    sessionTitlePlaceholder: "e.g., Financial Services Regulation 2025",
    documentLanguage: "Document Language",
    startTraining: "Start Training Session",
    loading: "Loading...",
    selectPDF: "Please select a PDF file",
    uploadSuccess: "✓ Uploaded successfully",
    regulatoryDocument: "Regulatory Document",
    writeNewsflash: "Write Your Newsflash",
    writeInEnglish: "Write in English regardless of source document language",
    executiveSummary: "Executive Summary (30-100 words)",
    summaryPlaceholder: "Write a concise executive summary...",
    impactAnalysis: "Client Impact Analysis",
    impactPlaceholder: "Analyze specific business impacts...",
    documentStructure: "Document Structure",
    structurePlaceholder: "Outline your document structure...",
    submitNewsflash: "Submit Newsflash",
    analyzing: "Analyzing...",
    trainingComplete: "Training Complete!",
    score: "Score",
    feedback: "AI Teacher Feedback",
    improvements: "Specific Improvements",
    backHome: "Back to Home",
    tryAgain: "Try Again",
    words: "words",
    timeLeft: "Time Left",
    error: "Error"
  }
};

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
  const [interfaceLanguage, setInterfaceLanguage] = useState('en');
  const [analyzing, setAnalyzing] = useState(false); // Separate analyzing state

  const t = translations[interfaceLanguage] || translations.en;

  // Initialize uploaded files from existing session data
  useEffect(() => {
    const initializeUploadedFiles = async () => {
      if (state.sessionId && state.language) {
        try {
          const result = await api.getSession(state.sessionId);
          if (result.success) {
            setUploadedFiles(prev => ({
              ...prev,
              [state.language]: { 
                name: result.fileName || 'Uploaded Document.pdf', 
                sessionId: state.sessionId 
              }
            }));
          }
        } catch (error) {
          console.log('Session not found or expired:', error.message);
          updateState({ sessionId: null, documentContent: '' });
        }
      }
    };

    initializeUploadedFiles();
  }, [state.sessionId, state.language]);

  // Timer for game mode
  useEffect(() => {
    if (state.mode === 'game' && state.timeLeft > 0 && !analyzing) {
      const timer = setTimeout(() => {
        updateState({ timeLeft: state.timeLeft - 1 });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.mode, state.timeLeft, updateState, analyzing]);

  // REMOVED: Auto-submit when time runs out to prevent unwanted submissions

  const handleFileUpload = async (language, file) => {
    if (!file || file.type !== 'application/pdf') {
      alert(t.selectPDF);
      return;
    }

    await execute(
      () => api.uploadPDF(file, language, state.sessionTitle || 'Training Session'),
      (result) => {
        setUploadedFiles(prev => ({
          ...prev,
          [language]: { name: file.name, sessionId: result.sessionId }
        }));
        updateState({ 
          sessionId: result.sessionId,
          language: language
        });
        console.log('Upload successful:', result);
      }
    );
  };

  const startTrainingSession = async () => {
    const fileInfo = uploadedFiles[state.language];
    if (!fileInfo?.sessionId) {
      alert('Please upload a document for the selected language');
      return;
    }

    await execute(
      () => api.getSession(fileInfo.sessionId),
      (result) => {
        updateState({
          mode: 'game',
          documentContent: result.content,
          timeLeft: 1200,
          sessionId: fileInfo.sessionId,
          submission: { summary: '', impacts: '', structure: '' }
        });
      }
    );
  };

  // FIXED: Simplified submitAnalysis function
  const submitAnalysis = async () => {
    // Prevent multiple submissions
    if (analyzing) return;

    // Validate submission
    const summaryWords = state.submission.summary.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (summaryWords < 30 || summaryWords > 100) {
      alert('Please write a summary between 30-100 words');
      return;
    }

    if (!state.submission.impacts.trim()) {
      alert('Please write an impact analysis');
      return;
    }

    if (!state.submission.structure.trim()) {
      alert('Please write a document structure');
      return;
    }

    setAnalyzing(true);

    try {
      const submissionData = {
        sessionId: state.sessionId,
        language: state.language,
        submission: state.submission,
        documentContent: state.documentContent
      };

      console.log('Submitting analysis:', submissionData);

      const response = await fetch('https://regulatory-trainer-v2-production.up.railway.app/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Analysis result:', result);

      // Update state to show feedback
      updateState({
        mode: 'feedback',
        score: result.score || 0,
        feedback: result.feedback || {
          items: [{ type: 'info', text: 'Analysis completed successfully' }],
          improvements: ['Continue practicing to improve your skills']
        }
      });

    } catch (error) {
      console.error('Analysis error:', error);
      
      // Provide local fallback scoring
      const localScore = calculateLocalScore(state.submission);
      
      updateState({
        mode: 'feedback',
        score: localScore,
        feedback: {
          items: [
            { type: 'warning', text: 'AI analysis temporarily unavailable - local scoring provided' },
            { type: 'info', text: `Your submission has been evaluated with a score of ${localScore}/100` }
          ],
          improvements: [
            'Ensure executive summary is 30-100 words',
            'Provide specific business impact analysis',
            'Include clear document structure',
            'Try again when AI service is available for detailed feedback'
          ]
        }
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Local scoring calculation
  const calculateLocalScore = (submission) => {
    let score = 0;
    
    const summaryWords = submission.summary.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (summaryWords >= 30 && summaryWords <= 100) {
      score += 40;
    } else if (summaryWords >= 20) {
      score += 20;
    }
    
    if (submission.impacts.trim().length > 100) {
      score += 30;
    } else if (submission.impacts.trim().length > 50) {
      score += 15;
    }
    
    if (submission.structure.trim().length > 50) {
      score += 30;
    } else if (submission.structure.trim().length > 20) {
      score += 15;
    }
    
    return Math.min(score, 100);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFeedbackIcon = (type) => {
    switch (type) {
      case 'good': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default: return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  // Check if training can start
  const canStartTraining = () => {
    const fileInfo = uploadedFiles[state.language];
    return fileInfo && fileInfo.sessionId && !loading;
  };

  // Check if submission is ready
  const canSubmit = () => {
    const summaryWords = state.submission.summary.trim().split(/\s+/).filter(w => w.length > 0).length;
    return summaryWords >= 30 && summaryWords <= 100 && 
           state.submission.impacts.trim().length > 20 &&
           state.submission.structure.trim().length > 20 &&
           !analyzing;
  };

  // Home Screen
  if (state.mode === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* Language Selector */}
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-2 bg-blue-800/50 rounded-lg p-2">
              <Globe className="w-4 h-4" />
              <select
                value={interfaceLanguage}
                onChange={(e) => setInterfaceLanguage(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none"
              >
                {Object.entries(languages).map(([code, name]) => (
                  <option key={code} value={code} className="bg-blue-800 text-white">
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
              <FileText className="text-yellow-400" />
              {t.appTitle}
            </h1>
            <p className="text-xl text-blue-200">{t.appSubtitle}</p>
          </div>

          {/* Role Selector */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => updateState({ userRole: 'trainer' })}
                className={`flex-1 p-3 rounded-lg transition-colors ${
                  state.userRole === 'trainer' 
                    ? 'bg-yellow-500 text-blue-900' 
                    : 'bg-blue-800 border border-blue-600 hover:bg-blue-700'
                }`}
              >
                <Settings className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">{t.trainerSetup}</div>
              </button>
              <button
                onClick={() => updateState({ userRole: 'student' })}
                className={`flex-1 p-3 rounded-lg transition-colors ${
                  state.userRole === 'student' 
                    ? 'bg-yellow-500 text-blue-900' 
                    : 'bg-blue-800 border border-blue-600 hover:bg-blue-700'
                }`}
              >
                <BookOpen className="w-5 h-5 mx-auto mb-1" />
                <div className="text-sm font-medium">{t.studentMode}</div>
              </button>
            </div>
          </div>

          {/* Trainer Mode */}
          {state.userRole === 'trainer' && (
            <div className="max-w-2xl mx-auto mb-8 bg-blue-800/50 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Upload className="text-yellow-400" />
                {t.uploadMaterials}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-white">{t.sessionTitle}</label>
                <input
                  type="text"
                  value={state.sessionTitle}
                  onChange={(e) => updateState({ sessionTitle: e.target.value })}
                  className="w-full p-3 rounded-lg bg-blue-700 border border-blue-600 text-white placeholder-blue-300 focus:outline-none focus:border-yellow-400"
                  placeholder={t.sessionTitlePlaceholder}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(languages).map(([code, name]) => (
                  <div key={code} className="bg-blue-700/50 rounded-lg p-4">
                    <label className="block text-sm font-medium mb-2 text-white">{name}</label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileUpload(code, e.target.files[0])}
                      className="w-full text-sm text-blue-200 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-blue-900 hover:file:bg-yellow-400"
                      disabled={loading}
                    />
                    {uploadedFiles[code] && (
                      <div className="mt-2 text-sm text-green-300 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        {uploadedFiles[code].name}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {Object.keys(uploadedFiles).length > 0 && (
                <div className="mt-6 p-4 bg-green-800/30 border border-green-600 rounded-lg">
                  <div className="text-sm text-green-200">
                    {t.uploadSuccess}: {Object.keys(uploadedFiles).length} file(s) uploaded
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Student Mode */}
          {state.userRole === 'student' && (
            <>
              <div className="max-w-md mx-auto mb-8">
                <label className="block text-sm font-medium mb-2 text-white">{t.documentLanguage}</label>
                <select 
                  value={state.language} 
                  onChange={(e) => updateState({ language: e.target.value })}
                  className="w-full p-3 rounded-lg bg-blue-800 border border-blue-600 text-white focus:outline-none focus:border-yellow-400"
                >
                  {Object.entries(languages).map(([code, name]) => (
                    <option key={code} value={code} className="bg-blue-800">
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-center">
                <button 
                  onClick={startTrainingSession}
                  disabled={!canStartTraining()}
                  className={`font-bold py-4 px-8 rounded-lg text-xl transition-colors shadow-lg ${
                    canStartTraining()
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-blue-900'
                      : 'bg-gray-600 cursor-not-allowed text-gray-300'
                  }`}
                >
                  {loading ? t.loading : t.startTraining}
                </button>
                
                {!canStartTraining() && !loading && (
                  <p className="text-blue-300 text-sm mt-3">
                    {uploadedFiles[state.language] 
                      ? 'Click to start your training session'
                      : 'Please ask your trainer to upload documents first'
                    }
                  </p>
                )}
              </div>
            </>
          )}

          {/* Error Display */}
          {error && (
            <div className="max-w-md mx-auto mt-4 p-3 bg-red-600 text-white rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {t.error}: {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Game Screen - IMPROVED CONTRAST AND COLORS
  if (state.mode === 'game') {
    const summaryWordCount = state.submission.summary.trim().split(/\s+/).filter(w => w.length > 0).length;
    const isValidSummary = summaryWordCount >= 30 && summaryWordCount <= 100;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-blue-900 text-white p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold text-white">{state.sessionTitle}</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-white" />
                <span className={`font-mono text-lg font-bold ${state.timeLeft < 300 ? 'text-red-300 animate-pulse' : 'text-white'}`}>
                  {formatTime(state.timeLeft)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto p-4">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Document Panel */}
            <div className="bg-white rounded-lg shadow-lg p-6 border">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                <FileText className="text-blue-600" />
                {t.regulatoryDocument}
              </h2>
              <div className="bg-gray-50 p-4 rounded border max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                  {state.documentContent}
                </pre>
              </div>
            </div>

            {/* Writing Panel */}
            <div className="bg-white rounded-lg shadow-lg p-6 border">
              <h2 className="text-xl font-bold mb-2 text-gray-900">{t.writeNewsflash}</h2>
              <p className="text-sm text-blue-700 mb-4 italic bg-blue-50 p-3 rounded border">
                {t.writeInEnglish}
              </p>
              
              <div className="space-y-4">
                {/* Executive Summary */}
                <div>
                  <label className="block font-medium mb-2 text-gray-900">{t.executiveSummary}</label>
                  <textarea
                    value={state.submission.summary}
                    onChange={(e) => updateState({
                      submission: { ...state.submission, summary: e.target.value }
                    })}
                    className={`w-full p-3 border-2 rounded-lg h-24 resize-none focus:outline-none text-gray-900 ${
                      isValidSummary 
                        ? 'border-green-500 bg-green-50 focus:border-green-600' 
                        : 'border-gray-300 bg-white focus:border-blue-500'
                    }`}
                    placeholder={t.summaryPlaceholder}
                  />
                  <div className={`text-sm mt-1 flex justify-between font-medium ${
                    isValidSummary 
                      ? 'text-green-700' 
                      : summaryWordCount > 100 
                        ? 'text-red-700' 
                        : 'text-gray-700'
                  }`}>
                    <span>{summaryWordCount} {t.words}</span>
                    <span className="text-xs">30-100 words required</span>
                  </div>
                </div>

                {/* Impact Analysis */}
                <div>
                  <label className="block font-medium mb-2 text-gray-900">{t.impactAnalysis}</label>
                  <textarea
                    value={state.submission.impacts}
                    onChange={(e) => updateState({
                      submission: { ...state.submission, impacts: e.target.value }
                    })}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg h-32 resize-none focus:outline-none focus:border-blue-500 text-gray-900 bg-white"
                    placeholder={t.impactPlaceholder}
                  />
                </div>

                {/* Document Structure */}
                <div>
                  <label className="block font-medium mb-2 text-gray-900">{t.documentStructure}</label>
                  <textarea
                    value={state.submission.structure}
                    onChange={(e) => updateState({
                      submission: { ...state.submission, structure: e.target.value }
                    })}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg h-24 resize-none focus:outline-none focus:border-blue-500 text-gray-900 bg-white"
                    placeholder={t.structurePlaceholder}
                  />
                </div>

                {/* Submit Button - FIXED */}
                <button 
                  onClick={submitAnalysis}
                  disabled={!canSubmit()}
                  className={`w-full font-bold py-4 px-4 rounded-lg text-lg transition-colors shadow-lg ${
                    canSubmit()
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-400 cursor-not-allowed text-gray-600'
                  }`}
                >
                  {analyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t.analyzing}
                    </span>
                  ) : (
                    t.submitNewsflash
                  )}
                </button>

                {/* Progress Indicator */}
                <div className="flex justify-between text-sm font-medium">
                  <span className={state.submission.summary.trim() ? 'text-green-700' : 'text-gray-500'}>
                    Summary {state.submission.summary.trim() ? '✓' : '○'}
                  </span>
                  <span className={state.submission.impacts.trim() ? 'text-green-700' : 'text-gray-500'}>
                    Impact {state.submission.impacts.trim() ? '✓' : '○'}
                  </span>
                  <span className={state.submission.structure.trim() ? 'text-green-700' : 'text-gray-500'}>
                    Structure {state.submission.structure.trim() ? '✓' : '○'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Feedback Screen - IMPROVED CONTRAST
  if (state.mode === 'feedback') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 border">
              {/* Header */}
              <div className="text-center mb-8">
                <Award className={`w-16 h-16 mx-auto mb-4 ${getScoreColor(state.score)}`} />
                <h1 className="text-3xl font-bold mb-2 text-gray-900">{t.trainingComplete}</h1>
                <div className={`text-4xl font-bold ${getScoreColor(state.score)}`}>
                  {t.score}: {state.score}/100
                </div>
                
                {/* Score Interpretation */}
                <div className="mt-4 text-lg">
                  {state.score >= 80 && <span className="text-green-700 font-semibold">Excellent Work!</span>}
                  {state.score >= 60 && state.score < 80 && <span className="text-yellow-700 font-semibold">Good Progress</span>}
                  {state.score < 60 && <span className="text-red-700 font-semibold">Keep Practicing</span>}
                </div>
              </div>

              {/* Feedback Content */}
              {state.feedback && (
                <div className="space-y-6 mb-8">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-900">
                    <CheckCircle className="text-blue-600" />
                    {t.feedback}
                  </h2>
                  
                  {/* Feedback Items */}
                  {state.feedback.items?.map((item, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 flex items-start gap-3 ${
                      item.type === 'good' ? 'bg-green-50 border-green-500' :
                      item.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                      item.type === 'info' ? 'bg-blue-50 border-blue-500' :
                      'bg-red-50 border-red-500'
                    }`}>
                      {getFeedbackIcon(item.type)}
                      <p className="text-gray-900 flex-1 font-medium">{item.text}</p>
                    </div>
                  ))}

                  {/* Improvements Section */}
                  {state.feedback.improvements && state.feedback.improvements.length > 0 && (
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mt-6">
                      <h3 className="font-bold mb-3 flex items-center gap-2 text-blue-900">
                        <AlertCircle className="text-blue-600" />
                        {t.improvements}
                      </h3>
                      <div className="space-y-3">
                        {state.feedback.improvements.map((improvement, index) => (
                          <div key={index} className="bg-white p-3 rounded border-l-4 border-blue-500 shadow-sm">
                            <p className="text-gray-900">{improvement}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center flex-wrap">
                <button 
                  onClick={() => updateState({ mode: 'home' })}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  {t.backHome}
                </button>
                <button 
                  onClick={() => updateState({ 
                    mode: 'game', 
                    timeLeft: 1200,
                    submission: { summary: '', impacts: '', structure: '' }
                  })}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  {t.tryAgain}
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