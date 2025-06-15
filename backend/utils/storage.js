import fs from 'fs/promises';
import path from 'path';

class Storage {
  constructor() {
    this.dataDir = './data';
    this.uploadsDir = './uploads';
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Storage initialization error:', error);
    }
  }

  async saveSession(sessionData) {
    const filePath = path.join(this.dataDir, `session_${sessionData.id}.json`);
    try {
      await fs.writeFile(filePath, JSON.stringify(sessionData, null, 2));
      return sessionData.id;
    } catch (error) {
      console.error('Save session error:', error);
      throw new Error('Failed to save session');
    }
  }

  async getSession(sessionId) {
    const filePath = path.join(this.dataDir, `session_${sessionId}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Get session error:', error);
      throw new Error('Session not found');
    }
  }

  async cleanupOldFiles() {
    try {
      const files = await fs.readdir(this.uploadsDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filePath = path.join(this.uploadsDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`Cleaned up old file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  generateId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}

const storage = new Storage();

// Cleanup old files every hour
setInterval(() => {
  storage.cleanupOldFiles();
}, 60 * 60 * 1000);

export default storage;