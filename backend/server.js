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

// Debug routes - MOVED BEFORE 404 HANDLER
app.get('/api/debug/claude', (req, res) => {
  res.json({
    hasClaudeKey: !!process.env.CLAUDE_API_KEY,
    keyPrefix: process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.substring(0, 15) + '...' : 'Not found',
    nodeEnv: process.env.NODE_ENV,
    claudeState: {
      fallbackActive: claude.fallbackActive,
      retryCount: claude.retryCount
    }
  });
});

app.get('/api/debug/prompt', (req, res) => {
  const testSubmission = {
    summary: "Test summary for checking prompt",
    impacts: "Test impact analysis",
    structure: "Test structure"
  };
  
  try {
    // Get the current prompt being used
    const prompt = claude.buildEnhancedPrompt(testSubmission, "Test document content");
    
    res.json({
      success: true,
      hasPrompt: !!prompt,
      promptLength: prompt.length,
      includesProfessionalExample: prompt.includes('professionalExample'),
      includesMandatory: prompt.includes('MANDATORY'),
      includesSONNET4: prompt.includes('claude-sonnet-4'),
      promptPreview: prompt.substring(0, 500) + '...',
      promptEnd: '...' + prompt.substring(prompt.length - 300)
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      hasClaudeMethod: typeof claude.buildEnhancedPrompt === 'function',
      claudeKeys: Object.getOwnPropertyNames(claude)
    });
  }
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

// 404 handler - MUST BE LAST
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