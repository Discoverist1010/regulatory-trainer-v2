const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class API {
  async request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async uploadPDF(file, language, sessionTitle) {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('language', language);
    formData.append('sessionTitle', sessionTitle);

    return this.request('/api/upload', {
      method: 'POST',
      headers: {}, // Remove Content-Type for FormData
      body: formData
    });
  }

  async analyzeSubmission(data) {
    return this.request('/api/analyze', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getSession(sessionId) {
    return this.request(`/api/session/${sessionId}`);
  }

  async healthCheck() {
    return this.request('/api/health');
  }
}

export default new API();