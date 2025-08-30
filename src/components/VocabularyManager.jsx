import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  BarChart3,
  Save,
  X,
  Check,
  AlertCircle,
  TrendingUp,
  Hash,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { vocabularyService } from '../lib/vocabularyService.js';

const VocabularyManager = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('terms');
  const [terms, setTerms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddTerm, setShowAddTerm] = useState(false);
  const [showAddCorrection, setShowAddCorrection] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newTermCategory, setNewTermCategory] = useState('Persoonlijk');
  const [correctionOriginal, setCorrectionOriginal] = useState('');
  const [correctionCorrected, setCorrectionCorrected] = useState('');
  const [correctionContext, setCorrectionContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      await vocabularyService.initialize();
      const [termsData, categoriesData, statsData] = await Promise.all([
        vocabularyService.getTermsByCategory(),
        vocabularyService.getCategories(),
        vocabularyService.getStatistics()
      ]);
      
      setTerms(termsData);
      setCategories(categoriesData);
      setStatistics(statsData);
    } catch (error) {
      setMessage('Fout bij laden van woordenboek data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTerm = async () => {
    if (!newTerm.trim()) return;

    const success = await vocabularyService.addTerm(newTerm, newTermCategory);
    if (success) {
      setMessage('Term succesvol toegevoegd');
      setNewTerm('');
      setShowAddTerm(false);
      await loadData();
    } else {
      setMessage('Fout bij toevoegen van term');
    }
  };

  const handleAddCorrection = async () => {
    if (!correctionOriginal.trim() || !correctionCorrected.trim()) return;

    const success = await vocabularyService.addCorrection(
      correctionOriginal,
      correctionCorrected,
      correctionContext
    );
    
    if (success) {
      setMessage('Correctie succesvol toegevoegd');
      setCorrectionOriginal('');
      setCorrectionCorrected('');
      setCorrectionContext('');
      setShowAddCorrection(false);
      await loadData();
    } else {
      setMessage('Fout bij toevoegen van correctie');
    }
  };

  const handleExport = async () => {
    try {
      const data = await vocabularyService.exportVocabulary();
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vocabulary-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage('Woordenboek geëxporteerd');
    } catch (error) {
      setMessage('Fout bij exporteren');
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const success = await vocabularyService.importVocabulary(data);
        if (success) {
          setMessage('Woordenboek succesvol geïmporteerd');
          await loadData();
        } else {
          setMessage('Fout bij importeren van woordenboek');
        }
      } catch (error) {
        setMessage('Ongeldig bestandsformaat');
      }
    };
    reader.readAsText(file);
  };

  const filteredTerms = terms.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.color : 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Woordenboek Beheer</h2>
              <p className="text-sm text-gray-600">
                Beheer je persoonlijke medische woordenboek voor betere transcriptie
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Message */}
        {message && (
          <div className="mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2 text-blue-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{message}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'terms'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Termen ({terms.length})
          </button>
          <button
            onClick={() => setActiveTab('corrections')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'corrections'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Correcties
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'statistics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Statistieken
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'terms' && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-3 items-center">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Zoek termen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Alle categorieën</option>
                    {categories.map(category => (
                      <option key={category.name} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowAddTerm(true)}
                    size="sm"
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Term Toevoegen
                  </Button>
                  <Button
                    onClick={() => setShowAddCorrection(true)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Correctie Toevoegen
                  </Button>
                </div>
              </div>

              {/* Add Term Form */}
              {showAddTerm && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h3 className="font-medium">Nieuwe Term Toevoegen</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Nieuwe term..."
                          value={newTerm}
                          onChange={(e) => setNewTerm(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <select
                          value={newTermCategory}
                          onChange={(e) => setNewTermCategory(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          {categories.map(category => (
                            <option key={category.name} value={category.name}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddTerm} size="sm" disabled={!newTerm.trim()}>
                          <Save className="h-4 w-4 mr-1" />
                          Opslaan
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddTerm(false)}
                        >
                          Annuleren
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Add Correction Form */}
              {showAddCorrection && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h3 className="font-medium">Nieuwe Correctie Toevoegen</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Originele tekst..."
                          value={correctionOriginal}
                          onChange={(e) => setCorrectionOriginal(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Gecorrigeerde tekst..."
                          value={correctionCorrected}
                          onChange={(e) => setCorrectionCorrected(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Context (optioneel)..."
                        value={correctionContext}
                        onChange={(e) => setCorrectionContext(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleAddCorrection} 
                          size="sm" 
                          disabled={!correctionOriginal.trim() || !correctionCorrected.trim()}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Opslaan
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddCorrection(false)}
                        >
                          Annuleren
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Terms List */}
              <div className="grid gap-3">
                {filteredTerms.map(term => (
                  <Card key={term.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{term.term}</span>
                          <Badge className={getCategoryColor(term.category)}>
                            {term.category}
                          </Badge>
                          {term.frequency > 0 && (
                            <Badge variant="secondary" className="gap-1">
                              <Hash className="h-3 w-3" />
                              {term.frequency}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {term.lastUsed && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(term.lastUsed).toLocaleDateString('nl-NL')}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {filteredTerms.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Geen termen gevonden</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'statistics' && statistics && (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{statistics.totalTerms}</div>
                    <div className="text-sm text-gray-600">Totaal Termen</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{statistics.totalCorrections}</div>
                    <div className="text-sm text-gray-600">Correcties</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{Object.keys(statistics.categoryStats).length}</div>
                    <div className="text-sm text-gray-600">Categorieën</div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Verdeling per Categorie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(statistics.categoryStats).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <Badge className={getCategoryColor(category)}>
                          {category}
                        </Badge>
                        <span className="text-sm font-medium">{count} termen</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Most Used Terms */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Meest Gebruikte Termen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {statistics.mostUsedTerms.map((term, index) => (
                      <div key={term.id} className="flex items-center justify-between p-2 rounded-md bg-gray-50">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <span className="font-medium">{term.term}</span>
                          <Badge className={getCategoryColor(term.category)} variant="outline">
                            {term.category}
                          </Badge>
                        </div>
                        <Badge variant="secondary">{term.frequency}x</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Exporteren
            </Button>
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" className="gap-2" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Importeren
                </span>
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
          
          <Button onClick={onClose}>
            Sluiten
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VocabularyManager;

