import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import fs from 'fs/promises';

class PDFProcessor {
  async extractText(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);
      
      if (!data.text || data.text.length < 100) {
        throw new Error('PDF contains insufficient text content');
      }
      
      return {
        text: data.text,
        pages: data.numpages,
        info: data.info
      };
    } catch (error) {
      console.error('PDF processing error:', error);
      throw new Error(`Failed to process PDF: ${error.message}`);
    }
  }

  async cleanup(filePath) {
    try {
      await fs.unlink(filePath);
      console.log(`Cleaned up file: ${filePath}`);
    } catch (error) {
      console.error('File cleanup error:', error);
    }
  }

  validatePDF(file) {
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (file.mimetype !== 'application/pdf') {
      throw new Error('File must be a PDF');
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size must be less than 10MB');
    }
    
    return true;
  }
}

export default new PDFProcessor();