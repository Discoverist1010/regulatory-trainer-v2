import React, { useState, useEffect } from 'react';
import { Clock, FileText, Upload, BookOpen, Settings, Award, CheckCircle, AlertCircle, Globe } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import { useGameState } from './hooks/useGameState';
import { useAPI } from './hooks/useAPI';
import api from './utils/api';

// Multilingual support
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
  },
  id: {
    appTitle: "Regulatory Reporter",
    appSubtitle: "Kuasai penulisan newsflash regulasi",
    trainerSetup: "Pengaturan Pelatih",
    studentMode: "Mode Siswa",
    uploadMaterials: "Unggah Materi Pelatihan",
    sessionTitle: "Judul Sesi",
    sessionTitlePlaceholder: "contoh: Regulasi Jasa Keuangan 2025",
    documentLanguage: "Bahasa Dokumen",
    startTraining: "Mulai Sesi Pelatihan",
    loading: "Memuat...",
    selectPDF: "Silakan pilih file PDF",
    uploadSuccess: "✓ Berhasil diunggah",
    regulatoryDocument: "Dokumen Regulasi",
    writeNewsflash: "Tulis Newsflash Anda",
    writeInEnglish: "Tulis dalam bahasa Inggris terlepas dari bahasa dokumen sumber",
    executiveSummary: "Ringkasan Eksekutif (30-100 kata)",
    summaryPlaceholder: "Tulis ringkasan eksekutif yang ringkas...",
    impactAnalysis: "Analisis Dampak Klien",
    impactPlaceholder: "Analisis dampak bisnis spesifik...",
    documentStructure: "Struktur Dokumen",
    structurePlaceholder: "Buat kerangka struktur dokumen...",
    submitNewsflash: "Kirim Newsflash",
    analyzing: "Menganalisis...",
    trainingComplete: "Pelatihan Selesai!",
    score: "Skor",
    feedback: "Umpan Balik AI Teacher",
    improvements: "Perbaikan Spesifik",
    backHome: "Kembali ke Beranda",
    tryAgain: "Coba Lagi",
    words: "kata",
    timeLeft: "Waktu Tersisa",
    error: "Kesalahan"
  },
  'zh-cn': {
    appTitle: "法规报告员",
    appSubtitle: "掌握法规新闻快报写作",
    trainerSetup: "培训师设置",
    studentMode: "学生模式",
    uploadMaterials: "上传培训材料",
    sessionTitle: "会话标题",
    sessionTitlePlaceholder: "例如：金融服务法规2025",
    documentLanguage: "文档语言",
    startTraining: "开始培训会话",
    loading: "加载中...",
    selectPDF: "请选择PDF文件",
    uploadSuccess: "✓ 上传成功",
    regulatoryDocument: "法规文档",
    writeNewsflash: "撰写您的新闻快报",
    writeInEnglish: "无论源文档语言如何，都用英语撰写",
    executiveSummary: "执行摘要（30-100字）",
    summaryPlaceholder: "撰写简洁的执行摘要...",
    impactAnalysis: "客户影响分析",
    impactPlaceholder: "分析具体的业务影响...",
    documentStructure: "文档结构",
    structurePlaceholder: "概述您的文档结构...",
    submitNewsflash: "提交新闻快报",
    analyzing: "分析中...",
    trainingComplete: "培训完成！",
    score: "分数",
    feedback: "AI教师反馈",
    improvements: "具体改进",
    backHome: "返回首页",
    tryAgain: "重试",
    words: "字",
    timeLeft: "剩余时间",
    error: "错误"
  },
  'zh-tw': {
    appTitle: "法規報告員",
    appSubtitle: "掌握法規新聞快報寫作",
    trainerSetup: "培訓師設置",
    studentMode: "學生模式",
    uploadMaterials: "上傳培訓材料",
    sessionTitle: "會話標題",
    sessionTitlePlaceholder: "例如：金融服務法規2025",
    documentLanguage: "文檔語言",
    startTraining: "開始培訓會話",
    loading: "載入中...",
    selectPDF: "請選擇PDF檔案",
    uploadSuccess: "✓ 上傳成功",
    regulatoryDocument: "法規文檔",
    writeNewsflash: "撰寫您的新聞快報",
    writeInEnglish: "無論源文檔語言如何，都用英語撰寫",
    executiveSummary: "執行摘要（30-100字）",
    summaryPlaceholder: "撰寫簡潔的執行摘要...",
    impactAnalysis: "客戶影響分析",
    impactPlaceholder: "分析具體的業務影響...",
    documentStructure: "文檔結構",
    structurePlaceholder: "概述您的文檔結構...",
    submitNewsflash: "提交新聞快報",
    analyzing: "分析中...",
    trainingComplete: "培訓完成！",
    score: "分數",
    feedback: "AI教師反饋",
    improvements: "具體改進",
    backHome: "返回首頁",
    tryAgain: "重試",
    words: "字",
    timeLeft: "剩餘時間",
    error: "錯誤"
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

  const t = translations[interfaceLanguage] || translations.en;

  // Timer for game mode
  useEffect(() => {
    if (state.mode === 'game' && state.timeLeft > 0) {
      const timer = setTimeout(() => {
        updateState({ timeLeft: state.timeLeft - 1 });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.mode, state.timeLeft, updateState]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (state.mode === 'game' && state.timeLeft === 0) {
      submitAnalysis();
    }
  }, [state.timeLeft, state.mode]);

  const handleFileUpload = async (language, file) => {
    if (!file || file.type !== 'application/pdf') {
      alert(t.selectPDF);
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
          timeLeft: 1200,
          submission: { summary: '', impacts: '', structure: '' }
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

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFeedbackIcon = (type) => {
    switch (type) {
      case 'good': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
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
                <label className="block text-sm font-medium mb-2">{t.sessionTitle}</label>
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
                    <label className="block text-sm font-medium mb-2">{name}</label>
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
                <label className="block text-sm font-medium mb-2">{t.documentLanguage}</label>
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
                  disabled={!uploadedFiles[state.language] || loading}
                  className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-blue-900 font-bold py-4 px-8 rounded-lg text-xl transition-colors shadow-lg"
                >
                  {loading ? t.loading : t.startTraining}
                </button>
                
                {!uploadedFiles[state.language] && (
                  <p className="text-blue-300 text-sm mt-3">
                    Please ask your trainer to upload documents first
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

  // Game Screen
  if (state.mode === 'game') {
    const summaryWordCount = state.submission.summary.trim().split(/\s+/).filter(w => w.length > 0).length;
    const isValidSummary = summaryWordCount >= 30 && summaryWordCount <= 100;

    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-blue-900 text-white p-4 shadow-lg">
          <div className="container mx-auto flex justify-between items-center">
            <h1 className="text-xl font-bold">{state.sessionTitle}</h1>
            <div className="flex items-center gap-4">
              <select
                value={interfaceLanguage}
                onChange={(e) => setInterfaceLanguage(e.target.value)}
                className="bg-blue-800 border border-blue-600 rounded px-2 py-1 text-sm"
              >
                {Object.entries(languages).map(([code, name]) => (
                  <option key={code} value={code} className="bg-blue-800">
                    {name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className={`font-mono text-lg ${state.timeLeft < 300 ? 'text-red-300 animate-pulse' : ''}`}>
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
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FileText className="text-blue-600" />
                {t.regulatoryDocument}
              </h2>
              <div className="bg-gray-50 p-4 rounded border max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                  {state.documentContent}
                </pre>
              </div>
            </div>

            {/* Writing Panel */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-2">{t.writeNewsflash}</h2>
              <p className="text-sm text-blue-600 mb-4 italic bg-blue-50 p-2 rounded">
                {t.writeInEnglish}
              </p>
              
              <div className="space-y-4">
                {/* Executive Summary */}
                <div>
                  <label className="block font-medium mb-2">{t.executiveSummary}</label>
                  <textarea
                    value={state.submission.summary}
                    onChange={(e) => updateState({
                      submission: { ...state.submission, summary: e.target.value }
                    })}
                    className={`w-full p-3 border rounded-lg h-24 resize-none focus:outline-none focus:ring-2 ${
                      isValidSummary ? 'border-green-300 focus:ring-green-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder={t.summaryPlaceholder}
                  />
                  <div className={`text-sm mt-1 flex justify-between ${
                    isValidSummary ? 'text-green-600' : summaryWordCount > 100 ? 'text-red-600' : 'text-gray-500'
                  }`}>
                    <span>{summaryWordCount} {t.words}</span>
                    <span className="text-xs">30-100 words required</span>
                  </div>
                </div>

                {/* Impact Analysis */}
                <div>
                  <label className="block font-medium mb-2">{t.impactAnalysis}</label>
                  <textarea
                    value={state.submission.impacts}
                    onChange={(e) => updateState({
                      submission: { ...state.submission, impacts: e.target.value }
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.impactPlaceholder}
                  />
                </div>

                {/* Document Structure */}
                <div>
                  <label className="block font-medium mb-2">{t.documentStructure}</label>
                  <textarea
                    value={state.submission.structure}
                    onChange={(e) => updateState({
                      submission: { ...state.submission, structure: e.target.value }
                    })}
                    className="w-full p-3 border border-gray-300 rounded-lg h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.structurePlaceholder}
                  />
                </div>

                {/* Submit Button */}
                <button 
                  onClick={submitAnalysis}
                  disabled={loading || !state.submission.summary.trim() || !isValidSummary}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg"
                >
                  {loading ? t.analyzing : t.submitNewsflash}
                </button>

                {/* Progress Indicator */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span className={state.submission.summary.trim() ? 'text-green-600' : ''}>
                    Summary {state.submission.summary.trim() ? '✓' : '○'}
                  </span>
                  <span className={state.submission.impacts.trim() ? 'text-green-600' : ''}>
                    Impact {state.submission.impacts.trim() ? '✓' : '○'}
                  </span>
                  <span className={state.submission.structure.trim() ? 'text-green-600' : ''}>
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

  // Feedback Screen
  if (state.mode === 'feedback') {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto p-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <Award className={`w-16 h-16 mx-auto mb-4 ${getScoreColor(state.score)}`} />
                <h1 className="text-3xl font-bold mb-2">{t.trainingComplete}</h1>
                <div className={`text-4xl font-bold ${getScoreColor(state.score)}`}>
                  {t.score}: {state.score}/100
                </div>
                
                {/* Score Interpretation */}
                <div className="mt-4 text-lg">
                  {state.score >= 80 && <span className="text-green-600 font-semibold">Excellent Work!</span>}
                  {state.score >= 60 && state.score < 80 && <span className="text-yellow-600 font-semibold">Good Progress</span>}
                  {state.score < 60 && <span className="text-red-600 font-semibold">Keep Practicing</span>}
                </div>
              </div>

              {/* Feedback Content */}
              {state.feedback && (
                <div className="space-y-6 mb-8">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="text-blue-600" />
                    {t.feedback}
                  </h2>
                  
                  {/* Feedback Items */}
                  {state.feedback.items?.map((item, index) => (
                    <div key={index} className={`p-4 rounded-lg border-l-4 flex items-start gap-3 ${
                      item.type === 'good' ? 'bg-green-50 border-green-400' :
                      item.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                      'bg-red-50 border-red-400'
                    }`}>
                      {getFeedbackIcon(item.type)}
                      <p className="text-gray-800 flex-1">{item.text}</p>
                    </div>
                  ))}

                  {/* Improvements Section */}
                  {state.feedback.improvements && state.feedback.improvements.length > 0 && (
                    <div className="bg-blue-50 p-6 rounded-lg mt-6">
                      <h3 className="font-bold mb-3 flex items-center gap-2">
                        <AlertCircle className="text-blue-600" />
                        {t.improvements}
                      </h3>
                      <div className="space-y-3">
                        {state.feedback.improvements.map((improvement, index) => (
                          <div key={index} className="bg-white p-3 rounded border-l-4 border-blue-400 shadow-sm">
                            <p className="text-gray-700">{improvement}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Performance Breakdown */}
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="font-bold mb-3">Performance Breakdown</h3>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {state.submission.summary.trim().split(/\s+/).filter(w => w.length > 0).length}
                        </div>
                        <div className="text-gray-600">Summary Words</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {state.submission.impacts.length > 100 ? '✓' : '○'}
                        </div>
                        <div className="text-gray-600">Impact Analysis</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatTime(1200 - state.timeLeft)}
                        </div>
                        <div className="text-gray-600">Time Used</div>
                      </div>
                    </div>
                  </div>
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

export default AppWithErrorBoundary;/* Updated Tue Jun 17 08:55:33 CST 2025 */
