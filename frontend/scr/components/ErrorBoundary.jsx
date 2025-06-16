import React from 'react';
import { AlertTriangle, RefreshCw, Bug, Clock, Wifi } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      errorId: Math.random().toString(36).substring(2, 15)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // In production, you might want to log this to an error reporting service
    this.logError(error, errorInfo);
  }

  logError = (error, errorInfo) => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      sessionStorage: this.getSafeSessionStorage(),
      localStorage: this.getSafeLocalStorage()
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group('🚨 Error Boundary Report');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.log('Full Report:', errorReport);
      console.groupEnd();
    }

    // In production, send to error tracking service
    // Example: Sentry, LogRocket, etc.
    // this.sendToErrorService(errorReport);
  };

  getSafeSessionStorage = () => {
    try {
      return {
        gameState: sessionStorage.getItem('regulatory-trainer-state')?.substring(0, 200) + '...'
      };
    } catch {
      return { error: 'Could not access sessionStorage' };
    }
  };

  getSafeLocalStorage = () => {
    try {
      return {
        gameState: localStorage.getItem('regulatory-trainer-state')?.substring(0, 200) + '...'
      };
    } catch {
      return { error: 'Could not access localStorage' };
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleRefresh = () => {
    window.location.reload();
  };

  clearStorage = () => {
    try {
      localStorage.removeItem('regulatory-trainer-state');
      sessionStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear storage:', error);
      window.location.reload();
    }
  };

  getErrorType = (error) => {
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      return 'chunk';
    }
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'network';
    }
    if (error.name === 'TypeError') {
      return 'type';
    }
    return 'unknown';
  };

  renderErrorDetails = () => {
    if (!import.meta.env.DEV) return null;

    return (
      <details className="mt-4 text-xs">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
          Technical Details (Development)
        </summary>
        <div className="mt-2 p-3 bg-gray-100 rounded border text-left">
          <div className="mb-2">
            <strong>Error:</strong> {this.state.error?.message}
          </div>
          <div className="mb-2">
            <strong>Error ID:</strong> {this.state.errorId}
          </div>
          <div className="mb-2">
            <strong>Stack:</strong>
            <pre className="text-xs overflow-auto mt-1 p-2 bg-white border rounded">
              {this.state.error?.stack}
            </pre>
          </div>
          {this.state.errorInfo && (
            <div>
              <strong>Component Stack:</strong>
              <pre className="text-xs overflow-auto mt-1 p-2 bg-white border rounded">
                {this.state.errorInfo.componentStack}
              </pre>
            </div>
          )}
        </div>
      </details>
    );
  };

  render() {
    if (this.state.hasError) {
      const errorType = this.getErrorType(this.state.error);
      const isNetworkError = errorType === 'network';
      const isChunkError = errorType === 'chunk';

      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="mb-4">
              {isNetworkError ? (
                <Wifi className="w-16 h-16 text-red-500 mx-auto" />
              ) : isChunkError ? (
                <Clock className="w-16 h-16 text-orange-500 mx-auto" />
              ) : (
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
              )}
            </div>

            {/* Error Title */}
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {isNetworkError ? 'Connection Problem' :
               isChunkError ? 'App Update Available' :
               'Training Session Error'}
            </h2>

            {/* Error Message */}
            <p className="text-gray-600 mb-6">
              {isNetworkError ? 
                'Unable to connect to the training server. Please check your internet connection.' :
               isChunkError ?
                'The app has been updated. Please refresh to get the latest version.' :
                'Something went wrong during your training session. Your progress has been saved.'}
            </p>

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Primary Action */}
              <button
                onClick={isChunkError ? this.handleRefresh : this.handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                {isChunkError ? 'Refresh App' : 'Try Again'}
              </button>

              {/* Secondary Actions */}
              {!isChunkError && (
                <>
                  <button
                    onClick={this.handleRefresh}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Refresh Page
                  </button>

                  {this.state.retryCount > 2 && (
                    <button
                      onClick={this.clearStorage}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Reset Training Data
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Error ID for Support */}
            <div className="mt-6 text-xs text-gray-500">
              Error ID: {this.state.errorId}
              {this.state.retryCount > 0 && (
                <span className="ml-2">• Retry #{this.state.retryCount}</span>
              )}
            </div>

            {/* Development Details */}
            {this.renderErrorDetails()}

            {/* Help Text */}
            <div className="mt-4 text-xs text-gray-400">
              If this problem persists, try refreshing the page or clearing your browser cache.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;