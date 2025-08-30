// Data Retention Service for GDPR Compliance
// Automatically deletes data after 72 hours

import { taskDB } from './database.js';
import { vocabularyService } from './vocabularyService.js';

class DataRetentionService {
  constructor() {
    this.retentionPeriodHours = 72; // 72 hours as required
    this.checkIntervalMinutes = 60; // Check every hour
    this.isRunning = false;
    this.intervalId = null;
    this.onDataDeleted = null;
    this.onError = null;
  }

  // Initialize the service
  initialize() {
    if (this.isRunning) return;

    // Start periodic cleanup
    this.startPeriodicCleanup();
    
    // Run initial cleanup
    this.performCleanup();
    
    this.isRunning = true;
    console.log('Data retention service initialized');
  }

  // Set callback functions
  setCallbacks({ onDataDeleted, onError }) {
    this.onDataDeleted = onDataDeleted;
    this.onError = onError;
  }

  // Start periodic cleanup
  startPeriodicCleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      this.performCleanup();
    }, this.checkIntervalMinutes * 60 * 1000);
  }

  // Stop periodic cleanup
  stopPeriodicCleanup() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  // Perform cleanup of old data
  async performCleanup() {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - this.retentionPeriodHours);

      const deletionResults = {
        tasks: 0,
        audioFiles: 0,
        ocrData: 0,
        vocabularyCorrections: 0,
        timestamp: new Date().toISOString()
      };

      // Clean up tasks
      const tasksDeleted = await this.cleanupTasks(cutoffTime);
      deletionResults.tasks = tasksDeleted;

      // Clean up audio files from localStorage
      const audioDeleted = await this.cleanupAudioFiles(cutoffTime);
      deletionResults.audioFiles = audioDeleted;

      // Clean up OCR data from localStorage
      const ocrDeleted = await this.cleanupOCRData(cutoffTime);
      deletionResults.ocrData = ocrDeleted;

      // Clean up old vocabulary corrections (keep terms, remove old corrections)
      const vocabDeleted = await this.cleanupVocabularyCorrections(cutoffTime);
      deletionResults.vocabularyCorrections = vocabDeleted;

      // Log cleanup results
      if (deletionResults.tasks > 0 || deletionResults.audioFiles > 0 || 
          deletionResults.ocrData > 0 || deletionResults.vocabularyCorrections > 0) {
        console.log('Data retention cleanup completed:', deletionResults);
        
        if (this.onDataDeleted) {
          this.onDataDeleted(deletionResults);
        }
      }

      // Store cleanup log
      await this.logCleanupActivity(deletionResults);

    } catch (error) {
      console.error('Error during data cleanup:', error);
      if (this.onError) {
        this.onError(`Fout bij data opruiming: ${error.message}`);
      }
    }
  }

  // Clean up old tasks
  async cleanupTasks(cutoffTime) {
    try {
      // Get tasks older than cutoff time
      const oldTasks = await taskDB.tasks
        .where('createdAt')
        .below(cutoffTime)
        .toArray();

      if (oldTasks.length === 0) return 0;

      // Delete old tasks
      const taskIds = oldTasks.map(task => task.id);
      await taskDB.tasks.bulkDelete(taskIds);

      return oldTasks.length;
    } catch (error) {
      console.error('Error cleaning up tasks:', error);
      return 0;
    }
  }

  // Clean up audio files from localStorage
  async cleanupAudioFiles(cutoffTime) {
    try {
      let deletedCount = 0;
      const audioKeys = [];

      // Find audio-related keys in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('audio_') || key.startsWith('speech_'))) {
          audioKeys.push(key);
        }
      }

      // Check each audio file's timestamp
      for (const key of audioKeys) {
        try {
          const audioData = JSON.parse(localStorage.getItem(key));
          if (audioData && audioData.timestamp) {
            const audioDate = new Date(audioData.timestamp);
            if (audioDate < cutoffTime) {
              // Revoke blob URL if exists
              if (audioData.url) {
                URL.revokeObjectURL(audioData.url);
              }
              localStorage.removeItem(key);
              deletedCount++;
            }
          }
        } catch (error) {
          // If we can't parse the data, it's probably corrupted, so remove it
          localStorage.removeItem(key);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up audio files:', error);
      return 0;
    }
  }

  // Clean up OCR data from localStorage
  async cleanupOCRData(cutoffTime) {
    try {
      let deletedCount = 0;
      const ocrKeys = [];

      // Find OCR-related keys in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('ocr_') || key.startsWith('scan_'))) {
          ocrKeys.push(key);
        }
      }

      // Check each OCR data's timestamp
      for (const key of ocrKeys) {
        try {
          const ocrData = JSON.parse(localStorage.getItem(key));
          if (ocrData && ocrData.timestamp) {
            const ocrDate = new Date(ocrData.timestamp);
            if (ocrDate < cutoffTime) {
              localStorage.removeItem(key);
              deletedCount++;
            }
          }
        } catch (error) {
          // If we can't parse the data, remove it
          localStorage.removeItem(key);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up OCR data:', error);
      return 0;
    }
  }

  // Clean up old vocabulary corrections (keep terms, remove old corrections)
  async cleanupVocabularyCorrections(cutoffTime) {
    try {
      await vocabularyService.initialize();
      
      // Get old corrections from vocabulary database
      const oldCorrections = await vocabularyService.vocabularyDB.corrections
        .where('createdAt')
        .below(cutoffTime)
        .toArray();

      if (oldCorrections.length === 0) return 0;

      // Delete old corrections
      const correctionIds = oldCorrections.map(correction => correction.id);
      await vocabularyService.vocabularyDB.corrections.bulkDelete(correctionIds);

      // Reload vocabulary data
      await vocabularyService.loadData();

      return oldCorrections.length;
    } catch (error) {
      console.error('Error cleaning up vocabulary corrections:', error);
      return 0;
    }
  }

  // Log cleanup activity
  async logCleanupActivity(results) {
    try {
      const logEntry = {
        timestamp: results.timestamp,
        tasksDeleted: results.tasks,
        audioFilesDeleted: results.audioFiles,
        ocrDataDeleted: results.ocrData,
        vocabularyCorrectionsDeleted: results.vocabularyCorrections,
        retentionPeriodHours: this.retentionPeriodHours
      };

      // Store in localStorage with rotation (keep only last 10 entries)
      const logKey = 'data_retention_log';
      let logs = [];
      
      try {
        const existingLogs = localStorage.getItem(logKey);
        if (existingLogs) {
          logs = JSON.parse(existingLogs);
        }
      } catch (error) {
        logs = [];
      }

      logs.push(logEntry);
      
      // Keep only last 10 entries
      if (logs.length > 10) {
        logs = logs.slice(-10);
      }

      localStorage.setItem(logKey, JSON.stringify(logs));
    } catch (error) {
      console.error('Error logging cleanup activity:', error);
    }
  }

  // Get cleanup history
  getCleanupHistory() {
    try {
      const logKey = 'data_retention_log';
      const logs = localStorage.getItem(logKey);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Error getting cleanup history:', error);
      return [];
    }
  }

  // Get next cleanup time
  getNextCleanupTime() {
    if (!this.isRunning) return null;
    
    const now = new Date();
    const nextCleanup = new Date(now.getTime() + (this.checkIntervalMinutes * 60 * 1000));
    return nextCleanup;
  }

  // Get data retention status
  getRetentionStatus() {
    return {
      isRunning: this.isRunning,
      retentionPeriodHours: this.retentionPeriodHours,
      checkIntervalMinutes: this.checkIntervalMinutes,
      nextCleanupTime: this.getNextCleanupTime(),
      lastCleanupResults: this.getCleanupHistory().slice(-1)[0] || null
    };
  }

  // Manual cleanup trigger
  async triggerManualCleanup() {
    console.log('Manual cleanup triggered');
    await this.performCleanup();
  }

  // Get data age statistics
  async getDataAgeStatistics() {
    try {
      const now = new Date();
      const stats = {
        tasks: { total: 0, old: 0, recent: 0 },
        audioFiles: { total: 0, old: 0, recent: 0 },
        ocrData: { total: 0, old: 0, recent: 0 }
      };

      // Analyze tasks
      const allTasks = await taskDB.tasks.toArray();
      stats.tasks.total = allTasks.length;
      
      const cutoffTime = new Date(now.getTime() - (this.retentionPeriodHours * 60 * 60 * 1000));
      
      allTasks.forEach(task => {
        if (new Date(task.createdAt) < cutoffTime) {
          stats.tasks.old++;
        } else {
          stats.tasks.recent++;
        }
      });

      // Analyze localStorage data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        try {
          if (key.startsWith('audio_') || key.startsWith('speech_')) {
            stats.audioFiles.total++;
            const data = JSON.parse(localStorage.getItem(key));
            if (data && data.timestamp) {
              if (new Date(data.timestamp) < cutoffTime) {
                stats.audioFiles.old++;
              } else {
                stats.audioFiles.recent++;
              }
            }
          } else if (key.startsWith('ocr_') || key.startsWith('scan_')) {
            stats.ocrData.total++;
            const data = JSON.parse(localStorage.getItem(key));
            if (data && data.timestamp) {
              if (new Date(data.timestamp) < cutoffTime) {
                stats.ocrData.old++;
              } else {
                stats.ocrData.recent++;
              }
            }
          }
        } catch (error) {
          // Skip corrupted data
        }
      }

      return stats;
    } catch (error) {
      console.error('Error getting data age statistics:', error);
      return null;
    }
  }

  // Update retention period (for testing or configuration)
  updateRetentionPeriod(hours) {
    if (hours < 1 || hours > 168) { // Between 1 hour and 1 week
      throw new Error('Retention period must be between 1 and 168 hours');
    }
    
    this.retentionPeriodHours = hours;
    console.log(`Data retention period updated to ${hours} hours`);
  }

  // Cleanup and shutdown
  shutdown() {
    this.stopPeriodicCleanup();
    console.log('Data retention service shutdown');
  }
}

// Create singleton instance
export const dataRetentionService = new DataRetentionService();

// Auto-initialize when module is loaded
dataRetentionService.initialize();

export default dataRetentionService;

