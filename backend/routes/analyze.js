import express from 'express';
import claude from '../utils/claude.js';
import storage from '../utils/storage.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { sessionId, submission, documentContent } = req.body;

    if (!submission || !submission.summary || !submission.impacts) {
      return res.status(400).json({
        success: false,
        error: 'Missing required submission fields'
      });
    }

    // Get document content if not provided
    let content = documentContent;
    if (!content && sessionId) {
      try {
        const session = await storage.getSession(sessionId);
        content = session.content;
      } catch (error) {
        console.warn('Could not retrieve session content:', error.message);
      }
    }

    // Analyze with Claude (with local fallback)
    const analysis = await claude.analyzeSubmission(submission, content || '');
    
    // In analyze.js, after this line: const analysis = await claude.analyzeSubmission(submission, content || '');
    // Add this detailed debug logging:
    console.log('=== CLAUDE RESPONSE DEBUG ===');
    console.log('Analysis keys:', Object.keys(analysis || {}));
    console.log('Has professionalExample:', !!(analysis && analysis.professionalExample));
    console.log('professionalExample content:', JSON.stringify(analysis && analysis.professionalExample, null, 2));
    console.log('Analysis source:', analysis && analysis.source);
    console.log('Full analysis structure:', JSON.stringify(analysis, null, 2));
    console.log('=== END CLAUDE DEBUG ===');
    
    const response = {
      success: true,
      score: analysis.score,
      feedback: analysis.feedback,
      source: analysis.source,
      enhanced: analysis.enhanced,
      processingTime: Date.now() - startTime
    };

    if (analysis.message) {
      response.message = analysis.message;
    }

    res.json(response);

  } catch (error) {
    console.error('Analysis error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Analysis failed',
      message: 'Unable to analyze submission. Please try again.',
      processingTime: Date.now() - startTime
    });
  }
});

export default router;