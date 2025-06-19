import React, { useState, useEffect } from 'react';
import { Clock, FileText, AlertCircle, Check, ChevronRight } from 'lucide-react';

const StudentTraining = ({ session, onSubmit, onTimeout }) => {
  const [timeLeft, setTimeLeft] = useState(session.timeLimit * 60);
  const [submission, setSubmission] = useState({
    summary: '',
    impacts: '',
    structure: ''
  });
  const [activeSection, setActiveSection] = useState('summary');

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onTimeout();
    }
  }, [timeLeft, onTimeout]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerClass = () => {
    if (timeLeft < 300) return 'text-red-400 animate-pulse';
    if (timeLeft < 600) return 'text-yellow-400';
    return 'text-gray-300';
  };

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const getSummaryStatus = () => {
    const words = countWords(submission.summary);
    if (words === 0) return { color: 'text-gray-500', message: '0/100 words' };
    if (words < 30) return { color: 'text-yellow-500', message: `${words}/100 words (min 30)` };
    if (words <= 100) return { color: 'text-green-500', message: `${words}/100 words` };
    return { color: 'text-red-500', message: `${words}/100 words (max 100)` };
  };

  const canSubmit = () => {
    const summaryWords = countWords(submission.summary);
    return summaryWords >= 30 && summaryWords <= 100 && 
           submission.impacts.trim().length > 20 &&
           submission.structure.trim().length > 20;
  };

  const getProgressDots = () => {
    const sections = ['summary', 'impact', 'structure'];
    return sections.map((section) => {
      const isCompleted = section === 'summary' 
        ? countWords(submission.summary) >= 30 && countWords(submission.summary) <= 100
        : section === 'impact' 
        ? submission.impacts.trim().length > 20
        : submission.structure.trim().length > 20;
      
      return {
        section,
        isCompleted,
        isActive: activeSection === section
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-100">{session.title}</h1>
            </div>
            <div className={`flex items-center gap-2 ${getTimerClass()}`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Article Panel */}
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 h-[calc(100vh-8rem)] 
            overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-gray-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Regulatory Document
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                  {session.documentContent}
                </pre>
              </div>
            </div>
          </div>

          {/* Writing Panel */}
          <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 h-[calc(100vh-8rem)] 
            overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-gray-100">Write Your Newsflash</h2>
              <p className="text-sm text-gray-400 mt-1">Write in English regardless of source document language</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* Executive Summary */}
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-blue-500 
                  transition-colors cursor-pointer"
                  onClick={() => setActiveSection('summary')}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-100">Executive Summary</h3>
                    <span className={`text-sm ${getSummaryStatus().color}`}>
                      {getSummaryStatus().message}
                    </span>
                  </div>
                  <textarea
                    value={submission.summary}
                    onChange={(e) => setSubmission({...submission, summary: e.target.value})}
                    placeholder="Write a concise executive summary (30-100 words) that captures the key regulatory change..."
                    className="w-full min-h-[100px] p-3 bg-gray-800 border border-gray-600 rounded-lg 
                      text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 
                      focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Client Impact Analysis */}
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-blue-500 
                  transition-colors cursor-pointer"
                  onClick={() => setActiveSection('impact')}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-100">Client Impact Analysis</h3>
                    <span className="text-sm text-gray-500">
                      {countWords(submission.impacts)} words
                    </span>
                  </div>
                  <textarea
                    value={submission.impacts}
                    onChange={(e) => setSubmission({...submission, impacts: e.target.value})}
                    placeholder="Analyze specific business impacts including:
- Timeline for implementation
- Operational implications
- Cost/benefit considerations
- Risk factors..."
                    className="w-full min-h-[150px] p-3 bg-gray-800 border border-gray-600 rounded-lg 
                      text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 
                      focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Document Structure */}
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-blue-500 
                  transition-colors cursor-pointer"
                  onClick={() => setActiveSection('structure')}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-gray-100">Key Details & Action Items</h3>
                    <span className="text-sm text-gray-500">
                      {countWords(submission.structure)} words
                    </span>
                  </div>
                  <textarea
                    value={submission.structure}
                    onChange={(e) => setSubmission({...submission, structure: e.target.value})}
                    placeholder="Outline key details and recommended actions:
- Regulatory requirements
- Implementation steps
- Timeline milestones
- Required documentation..."
                    className="w-full min-h-[150px] p-3 bg-gray-800 border border-gray-600 rounded-lg 
                      text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 
                      focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Submit Section */}
            <div className="p-6 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {getProgressDots().map(({ section, isCompleted, isActive }, index) => (
                    <div
                      key={section}
                      className={`h-2 transition-all ${
                        isActive ? 'w-6' : 'w-2'
                      } ${
                        isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-gray-600'
                      } rounded-full`}
                    />
                  ))}
                </div>
                
                <button
                  onClick={() => onSubmit(submission)}
                  disabled={!canSubmit()}
                  className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2
                    ${canSubmit()
                      ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg' 
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                >
                  Submit Newsflash
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTraining;