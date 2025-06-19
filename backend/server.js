import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import uploadRouter from './routes/upload.js';
import analyzeRouter from './routes/analyze.js';
import healthRouter from './routes/health.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Dynamic import for Claude module
let claude = null;

// Initialize Claude module
async function initializeClaude() {
  try {
    const claudeModule = await import('./utils/claude.js');
    claude = claudeModule.default;
    console.log('✅ Claude module loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load Claude module:', error);
  }
}

// CORS configuration - Fixed for Vercel deployment
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://regulatory-trainer-v2.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});
app.use('/api/', limiter);

// Routes
app.use('/api/health', healthRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/analyze', analyzeRouter);

// Debug routes - with Claude availability check
app.get('/api/debug/claude', (req, res) => {
  if (!claude) {
    return res.status(503).json({
      success: false,
      error: 'Claude module not loaded'
    });
  }
  
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
  if (!claude) {
    return res.status(503).json({
      success: false,
      error: 'Claude module not loaded'
    });
  }
  
  const testSubmission = {
    summary: "Test summary for checking prompt",
    impacts: "Test impact analysis",
    structure: "Test structure"
  };
  
  try {
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

app.get('/api/debug/claude-test', async (req, res) => {
  if (!claude) {
    return res.status(503).json({
      success: false,
      error: 'Claude module not loaded'
    });
  }
  
  try {
    const testSubmission = {
      summary: "The new regulation requires banks to implement enhanced risk management protocols within 6 months.",
      impacts: "Banks will need to allocate additional compliance resources and update their risk frameworks.",
      structure: "Executive Summary, Risk Analysis, Implementation Timeline, Cost Assessment"
    };
    
    console.log('🧪 Testing Claude with sample submission...');
    const analysis = await claude.analyzeSubmission(testSubmission, "Sample regulatory document about banking risk management requirements.");
    
    console.log('🧪 Claude test result keys:', Object.keys(analysis || {}));
    console.log('🧪 Has professionalExample:', !!(analysis && analysis.professionalExample));
    
    res.json({
      success: true,
      testSubmission,
      analysisKeys: Object.keys(analysis || {}),
      hasProfessionalExample: !!(analysis && analysis.professionalExample),
      professionalExample: analysis && analysis.professionalExample,
      source: analysis && analysis.source,
      score: analysis && analysis.score,
      feedback: analysis && analysis.feedback
    });
    
  } catch (error) {
    console.error('🧪 Claude test error:', error);
    res.json({
      success: false,
      error: error.message
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

// Start server with Claude initialization
async function startServer() {
  try {
    // Initialize Claude first
    await initializeClaude();
    
    // Then start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🤖 Claude module: ${claude ? 'Loaded' : 'Failed to load'}`);
    }).on('error', (err) => {
      console.error('❌ Server failed to start:', err);
    });
  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
}

startServer();