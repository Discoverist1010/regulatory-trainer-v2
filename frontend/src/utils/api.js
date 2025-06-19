const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class API {
  constructor() {
    this.baseURL = API_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Don't set Content-Type for FormData
    const headers = options.body instanceof FormData 
      ? { ...options.headers }
      : { ...this.defaultHeaders, ...options.headers };
    
    const config = {
      mode: 'cors', // Add this line
      credentials: 'include', // Add this line
      headers,
      ...options
    };

    // Add request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);
    config.signal = controller.signal;

    try {
      console.log(`API Request: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      clearTimeout(timeoutId);
      
      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = { message: await response.text() };
      }
      
      if (!response.ok) {
        const error = new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      console.log(`API Response: ${response.status}`, data.success ? '✓' : data);
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      console.error('API request failed:', error);
      throw error;
    }
  }

  async uploadPDF(file, language, sessionTitle) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.type !== 'application/pdf') {
      throw new Error('File must be a PDF');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      throw new Error('File size must be less than 10MB');
    }

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('language', language || 'en');
    formData.append('sessionTitle', sessionTitle || 'Training Session');

    return this.request('/api/upload', {
      method: 'POST',
      headers: {}, // Remove Content-Type for FormData
      body: formData,
      timeout: 60000 // 60 seconds for file upload
    });
  }

  async analyzeSubmission(data) {
    if (!data || !data.submission) {
      throw new Error('Missing submission data');
    }

    const { summary, impacts, structure } = data.submission;
    
    if (!summary || !impacts) {
      throw new Error('Summary and impact analysis are required');
    }

    // Validate summary word count
    const summaryWords = summary.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (summaryWords < 10) {
      throw new Error('Summary is too short (minimum 10 words)');
    }

    return this.request('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
      timeout: 45000 // 45 seconds for AI analysis
    });
  }

  async getSession(sessionId) {
    if (!sessionId) {
      throw new Error('Session ID is required');
    }

    return this.request(`/api/upload/session/${sessionId}`, {
      timeout: 15000
    });
  }

  async healthCheck() {
    return this.request('/api/health', {
      timeout: 5000
    });
  }

  // Utility method to check if API is available
  async checkConnection() {
    try {
      await this.healthCheck();
      return { status: 'connected', message: 'API is available' };
    } catch (error) {
      return { 
        status: 'disconnected', 
        message: error.message,
        isNetworkError: error.message.includes('fetch') || error.message.includes('Network')
      };
    }
  }

  // Method to validate environment
  validateEnvironment() {
    const issues = [];
    
    if (!this.baseURL || this.baseURL === 'http://localhost:3001') {
      if (import.meta.env.PROD) {
        issues.push('VITE_API_URL not set for production');
      }
    }

    if (!import.meta.env.VITE_API_URL) {
      issues.push('VITE_API_URL environment variable not configured');
    }

    return {
      isValid: issues.length === 0,
      issues,
      config: {
        apiUrl: this.baseURL,
        environment: import.meta.env.MODE,
        isProduction: import.meta.env.PROD
      }
    };
  }

  // Method to get detailed error info for debugging
  getErrorDetails(error) {
    return {
      message: error.message,
      status: error.status,
      data: error.data,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      apiUrl: this.baseURL
    };
  }
}

// Create singleton instance
const api = new API();

// Development utilities
if (import.meta.env.DEV) {
  // Make API available globally for debugging
  window.apiDebug = {
    api,
    checkConnection: () => api.checkConnection(),
    validateEnv: () => api.validateEnvironment(),
    testEndpoints: async () => {
      const results = {};
      
      try {
        results.health = await api.healthCheck();
      } catch (error) {
        results.health = { error: error.message };
      }

      return results;
    }
  };

  console.log('🔧 API Debug tools available via window.apiDebug');
  console.log('📡 API URL:', api.baseURL);
}

export default api;