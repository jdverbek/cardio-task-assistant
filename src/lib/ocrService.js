// OCR Service for Patient ID and Birth Date Recognition
import Tesseract from 'tesseract.js';

class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.onProgress = null;
    this.onError = null;
  }

  // Initialize Tesseract worker
  async initialize() {
    if (this.isInitialized) return true;

    try {
      this.worker = await Tesseract.createWorker('nld', 1, {
        logger: (m) => {
          if (this.onProgress && m.status === 'recognizing text') {
            this.onProgress(Math.round(m.progress * 100));
          }
        }
      });

      // Configure for better number and text recognition
      await this.worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-/. ',
        tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
        preserve_interword_spaces: '1'
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize OCR:', error);
      if (this.onError) {
        this.onError('Fout bij initialiseren van OCR engine');
      }
      return false;
    }
  }

  // Set callback functions
  setCallbacks({ onProgress, onError }) {
    this.onProgress = onProgress;
    this.onError = onError;
  }

  // Process image and extract patient data
  async processImage(imageFile) {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) return null;
    }

    try {
      // Recognize text from image
      const { data: { text } } = await this.worker.recognize(imageFile);
      
      // Extract patient information
      const extractedData = this.extractPatientInfo(text);
      
      return {
        rawText: text,
        extractedData: extractedData,
        confidence: this.calculateConfidence(extractedData),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('OCR processing error:', error);
      if (this.onError) {
        this.onError('Fout bij verwerken van afbeelding');
      }
      return null;
    }
  }

  // Extract patient ID and birth date from OCR text
  extractPatientInfo(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const extractedData = {
      patientId: null,
      birthDate: null,
      possibleIds: [],
      possibleDates: [],
      rawLines: lines
    };

    // Patterns for patient ID recognition
    const patientIdPatterns = [
      /(?:patient|pat|id|nummer|nr)[\s:]*([A-Z0-9]{6,12})/i,
      /([A-Z]{2,3}[0-9]{6,9})/g,
      /([0-9]{8,12})/g,
      /([A-Z][0-9]{7,10})/g
    ];

    // Patterns for birth date recognition
    const birthDatePatterns = [
      /(?:geb|geboren|birth|dob)[\s:]*([0-9]{1,2}[-\/\.][0-9]{1,2}[-\/\.][0-9]{2,4})/i,
      /([0-9]{1,2}[-\/\.][0-9]{1,2}[-\/\.][0-9]{4})/g,
      /([0-9]{2}[-\/\.][0-9]{2}[-\/\.][0-9]{2})/g,
      /([0-9]{4}[-\/\.][0-9]{1,2}[-\/\.][0-9]{1,2})/g
    ];

    // Extract patient IDs
    for (const line of lines) {
      for (const pattern of patientIdPatterns) {
        const matches = line.match(pattern);
        if (matches) {
          if (pattern.global) {
            extractedData.possibleIds.push(...matches);
          } else {
            extractedData.possibleIds.push(matches[1]);
          }
        }
      }
    }

    // Extract birth dates
    for (const line of lines) {
      for (const pattern of birthDatePatterns) {
        const matches = line.match(pattern);
        if (matches) {
          if (pattern.global) {
            extractedData.possibleDates.push(...matches);
          } else {
            extractedData.possibleDates.push(matches[1]);
          }
        }
      }
    }

    // Select best candidates
    extractedData.patientId = this.selectBestPatientId(extractedData.possibleIds);
    extractedData.birthDate = this.selectBestBirthDate(extractedData.possibleDates);

    return extractedData;
  }

  // Select the most likely patient ID
  selectBestPatientId(possibleIds) {
    if (possibleIds.length === 0) return null;

    // Remove duplicates
    const uniqueIds = [...new Set(possibleIds)];

    // Score each ID based on format likelihood
    const scoredIds = uniqueIds.map(id => ({
      id: id,
      score: this.scorePatientId(id)
    }));

    // Sort by score and return the best one
    scoredIds.sort((a, b) => b.score - a.score);
    return scoredIds[0].score > 0 ? scoredIds[0].id : null;
  }

  // Score patient ID based on common formats
  scorePatientId(id) {
    let score = 0;
    
    // Length scoring
    if (id.length >= 6 && id.length <= 12) score += 3;
    if (id.length >= 8 && id.length <= 10) score += 2;
    
    // Format scoring
    if (/^[A-Z]{2,3}[0-9]{6,9}$/.test(id)) score += 5; // Letters + numbers
    if (/^[0-9]{8,12}$/.test(id)) score += 4; // All numbers
    if (/^[A-Z][0-9]{7,10}$/.test(id)) score += 3; // Letter + numbers
    
    // Avoid common false positives
    if (/^[0-9]{4}$/.test(id)) score -= 2; // Too short
    if (/^[0-9]{13,}$/.test(id)) score -= 2; // Too long
    
    return score;
  }

  // Select the most likely birth date
  selectBestBirthDate(possibleDates) {
    if (possibleDates.length === 0) return null;

    // Remove duplicates
    const uniqueDates = [...new Set(possibleDates)];

    // Score each date based on format and validity
    const scoredDates = uniqueDates.map(date => ({
      date: date,
      score: this.scoreBirthDate(date),
      parsed: this.parseBirthDate(date)
    }));

    // Sort by score and return the best valid one
    scoredDates.sort((a, b) => b.score - a.score);
    const bestDate = scoredDates.find(d => d.score > 0 && d.parsed);
    return bestDate ? bestDate.date : null;
  }

  // Score birth date based on format and validity
  scoreBirthDate(dateStr) {
    let score = 0;
    
    // Try to parse the date
    const parsed = this.parseBirthDate(dateStr);
    if (!parsed) return 0;
    
    const now = new Date();
    const age = now.getFullYear() - parsed.getFullYear();
    
    // Age validation (reasonable age range)
    if (age >= 0 && age <= 120) score += 5;
    if (age >= 18 && age <= 100) score += 2;
    
    // Format scoring
    if (/^[0-9]{1,2}[-\/\.][0-9]{1,2}[-\/\.][0-9]{4}$/.test(dateStr)) score += 3;
    if (/^[0-9]{2}[-\/\.][0-9]{2}[-\/\.][0-9]{4}$/.test(dateStr)) score += 2;
    
    return score;
  }

  // Parse birth date string to Date object
  parseBirthDate(dateStr) {
    try {
      // Handle different date formats
      const formats = [
        /^([0-9]{1,2})[-\/\.]([0-9]{1,2})[-\/\.]([0-9]{4})$/, // DD/MM/YYYY or DD-MM-YYYY
        /^([0-9]{4})[-\/\.]([0-9]{1,2})[-\/\.]([0-9]{1,2})$/, // YYYY/MM/DD or YYYY-MM-DD
        /^([0-9]{2})[-\/\.]([0-9]{2})[-\/\.]([0-9]{2})$/      // DD/MM/YY or DD-MM-YY
      ];

      for (let i = 0; i < formats.length; i++) {
        const match = dateStr.match(formats[i]);
        if (match) {
          let day, month, year;
          
          if (i === 0) { // DD/MM/YYYY
            day = parseInt(match[1]);
            month = parseInt(match[2]) - 1; // Month is 0-indexed
            year = parseInt(match[3]);
          } else if (i === 1) { // YYYY/MM/DD
            year = parseInt(match[1]);
            month = parseInt(match[2]) - 1;
            day = parseInt(match[3]);
          } else { // DD/MM/YY
            day = parseInt(match[1]);
            month = parseInt(match[2]) - 1;
            year = parseInt(match[3]);
            // Assume 20xx for years 00-30, 19xx for years 31-99
            year += (year <= 30) ? 2000 : 1900;
          }
          
          const date = new Date(year, month, day);
          
          // Validate the date
          if (date.getDate() === day && 
              date.getMonth() === month && 
              date.getFullYear() === year) {
            return date;
          }
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  // Calculate overall confidence score
  calculateConfidence(extractedData) {
    let confidence = 0;
    
    if (extractedData.patientId) confidence += 50;
    if (extractedData.birthDate) confidence += 50;
    
    // Bonus for multiple candidates (shows good text recognition)
    if (extractedData.possibleIds.length > 1) confidence += 10;
    if (extractedData.possibleDates.length > 1) confidence += 10;
    
    // Penalty for too many false positives
    if (extractedData.possibleIds.length > 5) confidence -= 10;
    if (extractedData.possibleDates.length > 5) confidence -= 10;
    
    return Math.max(0, Math.min(100, confidence));
  }

  // Format extracted data for display
  formatExtractedData(extractedData) {
    const formatted = {
      patientId: extractedData.patientId || 'Niet gevonden',
      birthDate: null,
      birthDateFormatted: 'Niet gevonden'
    };

    if (extractedData.birthDate) {
      const parsed = this.parseBirthDate(extractedData.birthDate);
      if (parsed) {
        formatted.birthDate = parsed;
        formatted.birthDateFormatted = parsed.toLocaleDateString('nl-NL');
      } else {
        formatted.birthDateFormatted = extractedData.birthDate;
      }
    }

    return formatted;
  }

  // Clean up resources
  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  // Get processing status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasWorker: !!this.worker
    };
  }
}

// Create singleton instance
export const ocrService = new OCRService();
export default ocrService;

