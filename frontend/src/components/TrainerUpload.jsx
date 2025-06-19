import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Check, AlertCircle } from 'lucide-react';

const TrainerUpload = ({ onSessionCreate, api }) => {
  const [file, setFile] = useState(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(20);
  const [focusAreas, setFocusAreas] = useState({
    summary: true,
    impact: true,
    details: true
  });
  const [language, setLanguage] = useState('en');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file && file.type === 'application/pdf') {
      setFile(file);
    } else {
      alert('Please upload a PDF file');
    }
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateSession = async () => {
    if (!file || !sessionTitle.trim()) {
      alert('Please provide a session title and upload a document');
      return;
    }

    setIsUploading(true);
    try {
      const result = await api.uploadPDF(file, language, sessionTitle);
      onSessionCreate({
        sessionId: result.sessionId,
        title: sessionTitle,
        language,
        timeLimit,
        focusAreas
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-100 mb-2">Create Training Session</h1>
        <p className="text-gray-400">Upload regulatory documents and configure training parameters</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Document Upload</h2>
          
          {!file ? (
            <div
              className={`border-2 border-dashed ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600'} 
                rounded-lg p-8 text-center cursor-pointer transition-all hover:border-blue-500 hover:bg-gray-700/50`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-300 mb-2">Drop your PDF here or click to browse</p>
              <p className="text-sm text-gray-500">Supports PDF files up to 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => handleFile(e.target.files[0])}
                className="hidden"
              />
            </div>
          ) : (
            <div className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-gray-200 font-medium">{file.name}</p>
                  <p className="text-sm text-gray-400">{(file.size / 1048576).toFixed(1)} MB</p>
                </div>
              </div>
              <button
                onClick={removeFile}
                className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Document Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en">English</option>
              <option value="id">Bahasa Indonesia</option>
              <option value="zh-cn">简体中文</option>
              <option value="zh-tw">繁體中文</option>
            </select>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">Training Configuration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Session Title</label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="e.g., Q3 2025 Settlement Regulations Update"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 
                  placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Time Limit</label>
              <div className="flex gap-3">
                {[15, 20, 30].map((time) => (
                  <label key={time} className="flex-1">
                    <input
                      type="radio"
                      name="timeLimit"
                      value={time}
                      checked={timeLimit === time}
                      onChange={(e) => setTimeLimit(Number(e.target.value))}
                      className="sr-only"
                    />
                    <div className={`py-2 px-4 rounded-lg border text-center cursor-pointer transition-all
                      ${timeLimit === time 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'}`}
                    >
                      {time} min
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Focus Areas</label>
              <div className="space-y-2">
                {Object.entries({
                  summary: 'Executive Summary',
                  impact: 'Impact Analysis',
                  details: 'Action Items'
                }).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={focusAreas[key]}
                      onChange={(e) => setFocusAreas({...focusAreas, [key]: e.target.checked})}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded 
                        focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Section */}
      <div className="mt-8 flex items-center justify-between p-6 bg-gray-800 rounded-xl border border-gray-700">
        <p className="text-sm text-gray-400">Session will be available for 24 hours after creation</p>
        <div className="flex gap-3">
          <button
            className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 
              transition-colors font-medium"
          >
            Save as Draft
          </button>
          <button
            onClick={handleCreateSession}
            disabled={isUploading || !file || !sessionTitle.trim()}
            className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2
              ${isUploading || !file || !sessionTitle.trim()
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'}`}
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create Training Session
                <Check className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainerUpload;