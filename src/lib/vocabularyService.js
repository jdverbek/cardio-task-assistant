// Vocabulary Service for Transcription Finetuning
import Dexie from 'dexie';

// Database for vocabulary management
class VocabularyDatabase extends Dexie {
  constructor() {
    super('VocabularyDB');
    
    this.version(1).stores({
      terms: '++id, term, category, frequency, corrections, createdAt, lastUsed',
      corrections: '++id, original, corrected, frequency, createdAt, context',
      categories: '++id, name, description, color'
    });
  }
}

const vocabularyDB = new VocabularyDatabase();

// Default medical categories and terms
const defaultCategories = [
  {
    name: 'Cardiologie Algemeen',
    description: 'Algemene cardiologische termen',
    color: 'bg-red-100 text-red-800'
  },
  {
    name: 'Procedures',
    description: 'Medische procedures en interventies',
    color: 'bg-blue-100 text-blue-800'
  },
  {
    name: 'Medicatie',
    description: 'Geneesmiddelen en dosering',
    color: 'bg-green-100 text-green-800'
  },
  {
    name: 'Anatomie',
    description: 'Anatomische structuren',
    color: 'bg-purple-100 text-purple-800'
  },
  {
    name: 'Diagnostiek',
    description: 'Diagnostische termen en bevindingen',
    color: 'bg-orange-100 text-orange-800'
  },
  {
    name: 'Persoonlijk',
    description: 'Persoonlijke toevoegingen',
    color: 'bg-gray-100 text-gray-800'
  }
];

const defaultTerms = [
  // Cardiologie Algemeen
  { term: 'echocardiogram', category: 'Cardiologie Algemeen', frequency: 0 },
  { term: 'electrocardiogram', category: 'Cardiologie Algemeen', frequency: 0 },
  { term: 'hartkatheterisatie', category: 'Cardiologie Algemeen', frequency: 0 },
  { term: 'coronairangiografie', category: 'Cardiologie Algemeen', frequency: 0 },
  { term: 'myocardinfarct', category: 'Cardiologie Algemeen', frequency: 0 },
  { term: 'angina pectoris', category: 'Cardiologie Algemeen', frequency: 0 },
  { term: 'atriumfibrilleren', category: 'Cardiologie Algemeen', frequency: 0 },
  { term: 'hartfalen', category: 'Cardiologie Algemeen', frequency: 0 },
  { term: 'hypertensie', category: 'Cardiologie Algemeen', frequency: 0 },
  { term: 'bradycardie', category: 'Cardiologie Algemeen', frequency: 0 },
  { term: 'tachycardie', category: 'Cardiologie Algemeen', frequency: 0 },
  
  // Procedures
  { term: 'percutane coronaire interventie', category: 'Procedures', frequency: 0 },
  { term: 'ballondilatatie', category: 'Procedures', frequency: 0 },
  { term: 'stentplaatsing', category: 'Procedures', frequency: 0 },
  { term: 'pacemaker implantatie', category: 'Procedures', frequency: 0 },
  { term: 'cardioversie', category: 'Procedures', frequency: 0 },
  { term: 'ablatie', category: 'Procedures', frequency: 0 },
  { term: 'bypassoperatie', category: 'Procedures', frequency: 0 },
  { term: 'klepvervanging', category: 'Procedures', frequency: 0 },
  
  // Medicatie
  { term: 'acetylsalicylzuur', category: 'Medicatie', frequency: 0 },
  { term: 'clopidogrel', category: 'Medicatie', frequency: 0 },
  { term: 'atorvastatine', category: 'Medicatie', frequency: 0 },
  { term: 'metoprolol', category: 'Medicatie', frequency: 0 },
  { term: 'lisinopril', category: 'Medicatie', frequency: 0 },
  { term: 'furosemide', category: 'Medicatie', frequency: 0 },
  { term: 'warfarine', category: 'Medicatie', frequency: 0 },
  { term: 'digoxine', category: 'Medicatie', frequency: 0 },
  
  // Anatomie
  { term: 'linker ventrikel', category: 'Anatomie', frequency: 0 },
  { term: 'rechter ventrikel', category: 'Anatomie', frequency: 0 },
  { term: 'linker atrium', category: 'Anatomie', frequency: 0 },
  { term: 'rechter atrium', category: 'Anatomie', frequency: 0 },
  { term: 'aortaklep', category: 'Anatomie', frequency: 0 },
  { term: 'mitraalklep', category: 'Anatomie', frequency: 0 },
  { term: 'tricuspidaalklep', category: 'Anatomie', frequency: 0 },
  { term: 'pulmonaalklep', category: 'Anatomie', frequency: 0 },
  { term: 'coronairarterie', category: 'Anatomie', frequency: 0 },
  { term: 'circumflexarterie', category: 'Anatomie', frequency: 0 },
  
  // Diagnostiek
  { term: 'systolische functie', category: 'Diagnostiek', frequency: 0 },
  { term: 'diastolische functie', category: 'Diagnostiek', frequency: 0 },
  { term: 'ejectiefractie', category: 'Diagnostiek', frequency: 0 },
  { term: 'wandbewegingsstoornis', category: 'Diagnostiek', frequency: 0 },
  { term: 'klepinsufficiëntie', category: 'Diagnostiek', frequency: 0 },
  { term: 'klepstenose', category: 'Diagnostiek', frequency: 0 },
  { term: 'pericardeffusie', category: 'Diagnostiek', frequency: 0 },
  { term: 'troponine', category: 'Diagnostiek', frequency: 0 }
];

class VocabularyService {
  constructor() {
    this.initialized = false;
    this.terms = new Map();
    this.corrections = new Map();
    this.categories = new Map();
  }

  // Initialize the service
  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize default categories if empty
      const existingCategories = await vocabularyDB.categories.count();
      if (existingCategories === 0) {
        await vocabularyDB.categories.bulkAdd(defaultCategories);
      }

      // Initialize default terms if empty
      const existingTerms = await vocabularyDB.terms.count();
      if (existingTerms === 0) {
        const termsWithTimestamp = defaultTerms.map(term => ({
          ...term,
          corrections: 0,
          createdAt: new Date(),
          lastUsed: null
        }));
        await vocabularyDB.terms.bulkAdd(termsWithTimestamp);
      }

      // Load data into memory for fast access
      await this.loadData();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize vocabulary service:', error);
    }
  }

  // Load data from database into memory
  async loadData() {
    const [terms, corrections, categories] = await Promise.all([
      vocabularyDB.terms.toArray(),
      vocabularyDB.corrections.toArray(),
      vocabularyDB.categories.toArray()
    ]);

    // Build maps for fast lookup
    this.terms.clear();
    this.corrections.clear();
    this.categories.clear();

    terms.forEach(term => {
      this.terms.set(term.term.toLowerCase(), term);
    });

    corrections.forEach(correction => {
      const key = correction.original.toLowerCase();
      if (!this.corrections.has(key)) {
        this.corrections.set(key, []);
      }
      this.corrections.get(key).push(correction);
    });

    categories.forEach(category => {
      this.categories.set(category.name, category);
    });
  }

  // Apply corrections and learning to transcription
  async processTranscription(transcription) {
    if (!this.initialized) {
      await this.initialize();
    }

    let processedText = transcription;
    const appliedCorrections = [];

    // Apply known corrections
    for (const [original, corrections] of this.corrections.entries()) {
      const mostFrequent = corrections.reduce((prev, current) => 
        (prev.frequency > current.frequency) ? prev : current
      );

      const regex = new RegExp(`\\b${this.escapeRegex(original)}\\b`, 'gi');
      if (regex.test(processedText)) {
        processedText = processedText.replace(regex, mostFrequent.corrected);
        appliedCorrections.push({
          original: original,
          corrected: mostFrequent.corrected,
          confidence: Math.min(mostFrequent.frequency / 10, 1)
        });
      }
    }

    // Update term frequencies for recognized terms
    const words = processedText.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (this.terms.has(word)) {
        await this.incrementTermFrequency(word);
      }
    }

    return {
      originalText: transcription,
      processedText: processedText,
      appliedCorrections: appliedCorrections,
      suggestions: await this.getSuggestions(processedText)
    };
  }

  // Get suggestions for potential corrections
  async getSuggestions(text) {
    const words = text.toLowerCase().split(/\s+/);
    const suggestions = [];

    for (const word of words) {
      if (!this.terms.has(word)) {
        const similar = this.findSimilarTerms(word);
        if (similar.length > 0) {
          suggestions.push({
            original: word,
            suggestions: similar.slice(0, 3) // Top 3 suggestions
          });
        }
      }
    }

    return suggestions;
  }

  // Find similar terms using Levenshtein distance
  findSimilarTerms(word, maxDistance = 2) {
    const similar = [];
    
    for (const [term, data] of this.terms.entries()) {
      const distance = this.levenshteinDistance(word, term);
      if (distance <= maxDistance && distance > 0) {
        similar.push({
          term: data.term,
          distance: distance,
          frequency: data.frequency,
          category: data.category
        });
      }
    }

    // Sort by distance (ascending) and frequency (descending)
    return similar.sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      return b.frequency - a.frequency;
    });
  }

  // Add a new term to vocabulary
  async addTerm(term, category = 'Persoonlijk') {
    const termData = {
      term: term.trim(),
      category: category,
      frequency: 1,
      corrections: 0,
      createdAt: new Date(),
      lastUsed: new Date()
    };

    try {
      const id = await vocabularyDB.terms.add(termData);
      this.terms.set(term.toLowerCase(), { ...termData, id });
      return true;
    } catch (error) {
      console.error('Failed to add term:', error);
      return false;
    }
  }

  // Add a correction
  async addCorrection(original, corrected, context = '') {
    const correctionData = {
      original: original.trim(),
      corrected: corrected.trim(),
      frequency: 1,
      createdAt: new Date(),
      context: context
    };

    try {
      // Check if correction already exists
      const existing = await vocabularyDB.corrections
        .where(['original', 'corrected'])
        .equals([original.toLowerCase(), corrected])
        .first();

      if (existing) {
        // Increment frequency
        await vocabularyDB.corrections.update(existing.id, {
          frequency: existing.frequency + 1
        });
      } else {
        // Add new correction
        await vocabularyDB.corrections.add(correctionData);
      }

      // Update memory
      await this.loadData();
      return true;
    } catch (error) {
      console.error('Failed to add correction:', error);
      return false;
    }
  }

  // Increment term frequency
  async incrementTermFrequency(term) {
    const termData = this.terms.get(term.toLowerCase());
    if (termData) {
      try {
        await vocabularyDB.terms.update(termData.id, {
          frequency: termData.frequency + 1,
          lastUsed: new Date()
        });
        termData.frequency += 1;
        termData.lastUsed = new Date();
      } catch (error) {
        console.error('Failed to update term frequency:', error);
      }
    }
  }

  // Get all terms by category
  async getTermsByCategory(category = null) {
    if (category) {
      return Array.from(this.terms.values()).filter(term => term.category === category);
    }
    return Array.from(this.terms.values());
  }

  // Get all categories
  async getCategories() {
    return Array.from(this.categories.values());
  }

  // Get statistics
  async getStatistics() {
    const totalTerms = this.terms.size;
    const totalCorrections = Array.from(this.corrections.values())
      .reduce((sum, corrections) => sum + corrections.length, 0);
    
    const categoryStats = {};
    for (const term of this.terms.values()) {
      if (!categoryStats[term.category]) {
        categoryStats[term.category] = 0;
      }
      categoryStats[term.category]++;
    }

    const mostUsedTerms = Array.from(this.terms.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return {
      totalTerms,
      totalCorrections,
      categoryStats,
      mostUsedTerms
    };
  }

  // Export vocabulary data
  async exportVocabulary() {
    const [terms, corrections, categories] = await Promise.all([
      vocabularyDB.terms.toArray(),
      vocabularyDB.corrections.toArray(),
      vocabularyDB.categories.toArray()
    ]);

    return {
      terms,
      corrections,
      categories,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Import vocabulary data
  async importVocabulary(data) {
    try {
      if (data.terms) {
        await vocabularyDB.terms.bulkPut(data.terms);
      }
      if (data.corrections) {
        await vocabularyDB.corrections.bulkPut(data.corrections);
      }
      if (data.categories) {
        await vocabularyDB.categories.bulkPut(data.categories);
      }

      await this.loadData();
      return true;
    } catch (error) {
      console.error('Failed to import vocabulary:', error);
      return false;
    }
  }

  // Utility functions
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

// Create singleton instance
export const vocabularyService = new VocabularyService();
export default vocabularyService;

