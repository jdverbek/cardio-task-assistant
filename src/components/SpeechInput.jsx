import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Volume2, 
  Settings, 
  AlertCircle,
  CheckCircle,
  Loader2,
  BookOpen,
  Edit3,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { speechService, audioPlayer } from '../lib/speechService.js';
import { vocabularyService } from '../lib/vocabularyService.js';
import VocabularyManager from './VocabularyManager.jsx';

const SpeechInput = ({ 
  onTranscription, 
  onAudioRecorded,
  placeholder = "Klik op de microfoon om te beginnen met spreken...",
  className = ""
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [processedTranscription, setProcessedTranscription] = useState('');
  const [audioData, setAudioData] = useState(null);
  const [error, setError] = useState('');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [showVocabularyManager, setShowVocabularyManager] = useState(false);
  const [appliedCorrections, setAppliedCorrections] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const recordingTimeRef = useRef(0);
  const recordingIntervalRef = useRef(null);

  useEffect(() => {
    // Initialize services - API key now automatic from environment
    const hasApiKey = speechService.initialize();
    setApiKeyConfigured(hasApiKey);

    // Initialize vocabulary service
    vocabularyService.initialize();

    // Set up callbacks
    speechService.setCallbacks({
      onTranscriptionUpdate: handleTranscriptionUpdate,
      onRecordingStateChange: setIsRecording,
      onError: handleError
    });

    audioPlayer.setCallback(setIsPlaying);

    return () => {
      speechService.cleanup();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const handleTranscriptionUpdate = async (result) => {
    setIsProcessing(false);
    setTranscription(result.transcription);
    setAudioData(result.audio);
    
    // Process transcription with vocabulary service
    try {
      const processed = await vocabularyService.processTranscription(result.transcription);
      setProcessedTranscription(processed.processedText);
      setAppliedCorrections(processed.appliedCorrections);
      setSuggestions(processed.suggestions);
      
      if (onTranscription) {
        onTranscription(processed.processedText);
      }
    } catch (error) {
      console.error('Error processing transcription:', error);
      if (onTranscription) {
        onTranscription(result.transcription);
      }
    }
    
    if (onAudioRecorded) {
      onAudioRecorded(result.audio);
    }
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setIsRecording(false);
    setIsProcessing(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const startRecording = async () => {
    if (!apiKeyConfigured) {
      setError('OpenAI API key is niet geconfigureerd in environment variables');
      return;
    }

    setError('');
    setTranscription('');
    setProcessedTranscription('');
    setAudioData(null);
    setAppliedCorrections([]);
    setSuggestions([]);
    recordingTimeRef.current = 0;

    const success = await speechService.startRecording();
    if (success) {
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
      }, 1000);
    }
  };

  const stopRecording = () => {
    speechService.stopRecording();
    setIsProcessing(true);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const playAudio = () => {
    if (audioData && audioData.url) {
      audioPlayer.play(audioData.url);
    }
  };

  const stopAudio = () => {
    audioPlayer.stop();
  };

  const applySuggestion = async (original, suggested) => {
    // Add this as a correction to the vocabulary
    await vocabularyService.addCorrection(original, suggested, processedTranscription);
    
    // Update the transcription
    const updatedText = processedTranscription.replace(
      new RegExp(`\\b${original}\\b`, 'gi'), 
      suggested
    );
    setProcessedTranscription(updatedText);
    
    if (onTranscription) {
      onTranscription(updatedText);
    }
    
    // Remove this suggestion
    setSuggestions(prev => prev.filter(s => s.original !== original));
  };

  const reprocessTranscription = async () => {
    if (!transcription) return;
    
    try {
      const processed = await vocabularyService.processTranscription(transcription);
      setProcessedTranscription(processed.processedText);
      setAppliedCorrections(processed.appliedCorrections);
      setSuggestions(processed.suggestions);
      
      if (onTranscription) {
        onTranscription(processed.processedText);
      }
    } catch (error) {
      console.error('Error reprocessing transcription:', error);
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAudioSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!apiKeyConfigured) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Spraakherkenning Niet Beschikbaar</span>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                OpenAI API key is niet geconfigureerd in de environment variables.
              </p>
              <p className="text-xs text-gray-500">
                Neem contact op met de beheerder om VITE_OPENAI_API_KEY in te stellen.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Recording Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                variant={isRecording ? "destructive" : "default"}
                size="sm"
                className="gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                {isProcessing ? 'Verwerken...' : isRecording ? 'Stop Opname' : 'Start Opname'}
              </Button>

              {isRecording && (
                <Badge variant="destructive" className="animate-pulse">
                  REC {formatRecordingTime(recordingTimeRef.current)}
                </Badge>
              )}

              {isProcessing && (
                <Badge variant="secondary">
                  Transcriberen...
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVocabularyManager(true)}
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Woordenboek
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowApiKeyInput(true)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                API Key
              </Button>
            </div>
          </div>

          {!speechService.isSupported() && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  Audio opname wordt niet ondersteund door deze browser
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applied Corrections */}
      {appliedCorrections.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-blue-600">
                <Edit3 className="h-4 w-4" />
                <span className="text-sm font-medium">Toegepaste Correcties</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {appliedCorrections.map((correction, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {correction.original} → {correction.corrected}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-600">
                  <Lightbulb className="h-4 w-4" />
                  <span className="text-sm font-medium">Suggesties voor Verbetering</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                >
                  {showSuggestions ? 'Verbergen' : 'Tonen'}
                </Button>
              </div>
              
              {showSuggestions && (
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm">
                            <span className="font-medium text-red-600">{suggestion.original}</span>
                            {' → '}
                            <span className="font-medium text-green-600">
                              {suggestion.suggestions[0]?.term}
                            </span>
                          </span>
                          {suggestion.suggestions[0]?.category && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {suggestion.suggestions[0].category}
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applySuggestion(suggestion.original, suggestion.suggestions[0].term)}
                        >
                          Toepassen
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcription Result */}
      {(transcription || processedTranscription) && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Transcriptie</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {audioData && (
                    <>
                      <span className="text-xs text-gray-500">
                        {formatAudioSize(audioData.size)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={isPlaying ? stopAudio : playAudio}
                        className="gap-1"
                      >
                        {isPlaying ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                        {isPlaying ? 'Pause' : 'Afspelen'}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={reprocessTranscription}
                    className="gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Herverwerken
                  </Button>
                </div>
              </div>
              
              {/* Original transcription */}
              {transcription !== processedTranscription && (
                <div className="p-3 bg-gray-50 rounded-md border-l-4 border-gray-300">
                  <div className="text-xs text-gray-500 mb-1">Origineel:</div>
                  <p className="text-sm text-gray-600">{transcription}</p>
                </div>
              )}
              
              {/* Processed transcription */}
              <div className="p-3 bg-green-50 rounded-md border-l-4 border-green-300">
                {processedTranscription !== transcription && (
                  <div className="text-xs text-green-600 mb-1">Verbeterd:</div>
                )}
                <p className="text-sm text-gray-800">{processedTranscription || transcription}</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (onTranscription) {
                      onTranscription(processedTranscription || transcription);
                    }
                  }}
                >
                  Gebruiken
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTranscription('');
                    setProcessedTranscription('');
                    setAudioData(null);
                    setAppliedCorrections([]);
                    setSuggestions([]);
                  }}
                >
                  Wissen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Placeholder when no transcription */}
      {!transcription && !isRecording && !isProcessing && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-gray-500">
              <Volume2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{placeholder}</p>
              <p className="text-xs mt-1 text-gray-400">
                Spraakherkenning met intelligente medische terminologie correctie
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vocabulary Manager Modal */}
      <VocabularyManager
        isOpen={showVocabularyManager}
        onClose={() => setShowVocabularyManager(false)}
      />
    </div>
  );
};

export default SpeechInput;

