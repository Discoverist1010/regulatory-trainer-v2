import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

// Minimal middleware
app.use(express.json());

// Simple test routes
app.get('/', (req, res) => {
  res.json({ status: 'Server is working', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV
  });
});

app.get('/api/debug/test', (req, res) => {
  res.json({
    success: true,
    message: 'Debug endpoint working',
    env: {
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV,
      hasClaudeKey: !!process.env.CLAUDE_API_KEY
    }
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Minimal server running on port ${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌍 Listening on all interfaces (0.0.0.0)`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});