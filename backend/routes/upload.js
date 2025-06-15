import express from 'express';
import multer from 'multer';
import pdfProcessor from '../utils/pdf.js';
import storage from '../utils/storage.js';

const router = express.Router();

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

router.post('/', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No PDF file uploaded'
      });
    }

    const { language, sessionTitle } = req.body;

    // Validate PDF and extract text
    pdfProcessor.validatePDF(req.file);
    const pdfData = await pdfProcessor.extractText(req.file.path);

    // Create session
    const sessionData = {
      id: storage.generateId(),
      language,
      sessionTitle: sessionTitle || 'Training Session',
      content: pdfData.text,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      pages: pdfData.pages,
      uploadTime: new Date().toISOString()
    };

    // Save session
    await storage.saveSession(sessionData);

    // Cleanup uploaded file
    await pdfProcessor.cleanup(req.file.path);

    res.json({
      success: true,
      sessionId: sessionData.id,
      message: 'PDF uploaded and processed successfully',
      pages: pdfData.pages
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    // Cleanup file on error
    if (req.file?.path) {
      await pdfProcessor.cleanup(req.file.path);
    }

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get session data
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await storage.getSession(sessionId);
    
    res.json({
      success: true,
      ...session
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }
});

export default router;