import React from 'react';
import { Award, CheckCircle, AlertCircle, Users, TrendingUp, X } from 'lucide-react';

const FeedbackView = ({ score, feedback, submission, professionalExample, onClose, onRetry }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Excellent Work!';
    if (score >= 60) return 'Good Progress!';
    return 'Keep Practicing!';
  };

  const getFeedbackIcon = (type) => {
    switch (type) {
      case 'good': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'info': return <CheckCircle className="w-5 h-5 text-blue-400" />;
      default: return <AlertCircle className="w-5 h-5 text-red-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden 
        border border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-100">AI Feedback & Analysis</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Score Section */}
          <div className="p-6 text-center border-b border-gray-700">
            <Award className={`w-16 h-16 mx-auto mb-4 ${getScoreColor(score)}`} />
            <div className={`text-5xl font-bold mb-2 ${getScoreColor(score)}`}>
              {score}/100
            </div>
            <p className={`text-xl font-medium ${getScoreColor(score)}`}>
              {getScoreMessage(score)}
            </p>
          </div>

          {/* Feedback Items */}
          {feedback && feedback.items && feedback.items.length > 0 && (
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Detailed Feedback</h3>
              <div className="space-y-3">
                {feedback.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {getFeedbackIcon(item.type)}
                    <p className="text-gray-300 flex-1">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Impact Analysis Comparison */}
          {professionalExample && professionalExample.impactAnalysis && (
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-6 h-6 text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-100">Impact Analysis Comparison</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">Learn from this professional approach:</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {/* User Analysis */}
                <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                  <h4 className="font-medium text-gray-100 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                    Your Analysis
                  </h4>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {submission.impacts || "No impact analysis provided"}
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    Words: {submission.impacts ? submission.impacts.trim().split(/\s+/).length : 0}
                  </div>
                </div>

                {/* Professional Example */}
                <div className="bg-gray-700/50 rounded-lg p-4 border border-green-600/50">
                  <h4 className="font-medium text-green-400 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Professional Example
                  </h4>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {professionalExample.impactAnalysis}
                  </p>
                  <div className="mt-3 text-xs text-gray-500">
                    Words: {professionalExample.impactAnalysis.trim().split(/\s+/).length}
                  </div>
                </div>
              </div>

              {/* Key Differences */}
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Specific details & timelines</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                  <span>Clear business implications</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span>Professional structure</span>
                </div>
              </div>
            </div>
          )}

          {/* Improvements */}
          {feedback && feedback.improvements && feedback.improvements.length > 0 && (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
                <h3 className="text-lg font-semibold text-gray-100">Areas for Improvement</h3>
              </div>
              <div className="space-y-2">
                {feedback.improvements.map((improvement, index) => (
                  <div key={index} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                    <p className="text-sm text-gray-300">{improvement}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 
              transition-colors font-medium"
          >
            Review My Work
          </button>
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
              transition-colors font-medium"
          >
            Try New Article
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackView;