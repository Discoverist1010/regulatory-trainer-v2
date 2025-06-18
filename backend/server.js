import claude from './utils/claude.js';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import uploadRouter from './routes/upload.js';
import analyzeRouter from './routes/analyze.js';
import healthRouter from './routes/health.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'https://*.vercel.app'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  message: 'Too many requests, please try again later'
});
app.use('/api/', limiter);

// Routes
app.use('/api/health', healthRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/analyze', analyzeRouter);

// Add this temporary debug route to your backend/server.js
// (Place it with your other routes)
app.get('/api/debug/claude', (req, res) => {
  res.json({
    hasClaudeKey: !!process.env.CLAUDE_API_KEY,
    keyPrefix: process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.substring(0, 15) + '...' : 'Not found',
    nodeEnv: process.env.NODE_ENV,
    // Import claude to check its state
    claudeState: {
      fallbackActive: claude.fallbackActive,
      retryCount: claude.retryCount
    }
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
});