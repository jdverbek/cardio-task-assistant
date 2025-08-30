import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Scan,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  FileImage,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { ocrService } from '../lib/ocrService.js';

const OCRInput = ({ 
  onDataExtracted, 
  onImageCaptured,
  className = "" 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showRawText, setShowRawText] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Initialize OCR service
  React.useEffect(() => {
    ocrService.setCallbacks({
      onProgress: setProgress,
      onError: setError
    });

    return () => {
      stopCamera();
    };
  }, []);

  // Start camera for photo capture
  const startCamera = async () => {
    try {
      console.log('🍎 Starting camera...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 }
        }
      });
      
      console.log('📹 Camera stream obtained:', mediaStream);
      setStream(mediaStream);
      setShowCamera(true);
      
      // Wait for video element to be available
      setTimeout(() => {
        if (videoRef.current) {
          console.log('📺 Setting video source...');
          videoRef.current.srcObject = mediaStream;
          
          // Ensure video plays on Safari
          videoRef.current.onloadedmetadata = () => {
            console.log('📺 Video metadata loaded, starting playback');
            setVideoReady(true);
            videoRef.current.play().catch(e => {
              console.error('Video play error:', e);
            });
          };
        }
      }, 100);
      
    } catch (error) {
      console.error('Camera error:', error);
      setError(`Kan camera niet openen: ${error.message}. Controleer de permissies.`);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setVideoReady(false);
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas not available');
      setError('Camera niet gereed voor foto');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video is ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.error('Video not ready');
      setError('Video nog niet gereed, probeer opnieuw');
      return;
    }
    
    console.log('📸 Capturing photo...');
    const context = canvas.getContext('2d');

    // Set canvas size to video size
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;
    
    console.log(`📐 Canvas size: ${canvas.width}x${canvas.height}`);

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and process
    canvas.toBlob(async (blob) => {
      if (blob) {
        console.log(`📁 Photo captured: ${blob.size} bytes`);
        setCapturedImage(URL.createObjectURL(blob));
        stopCamera();
        await processImage(blob);
        
        if (onImageCaptured) {
          onImageCaptured(blob);
        }
      } else {
        console.error('Failed to create blob');
        setError('Foto maken mislukt, probeer opnieuw');
      }
    }, 'image/jpeg', 0.9);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setCapturedImage(URL.createObjectURL(file));
      processImage(file);
      
      if (onImageCaptured) {
        onImageCaptured(file);
      }
    }
  };

  // Process image with OCR
  const processImage = async (imageFile) => {
    setIsProcessing(true);
    setProgress(0);
    setError('');
    setExtractedData(null);

    try {
      const result = await ocrService.processImage(imageFile);
      
      if (result) {
        setExtractedData(result);
        
        if (onDataExtracted) {
          const formatted = ocrService.formatExtractedData(result.extractedData);
          onDataExtracted(formatted);
        }
      } else {
        setError('Geen tekst gevonden in de afbeelding');
      }
    } catch (error) {
      setError('Fout bij verwerken van afbeelding');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Reprocess current image
  const reprocessImage = async () => {
    if (!capturedImage) return;
    
    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      await processImage(blob);
    } catch (error) {
      setError('Fout bij herverwerken van afbeelding');
    }
  };

  // Clear all data
  const clearData = () => {
    setExtractedData(null);
    setCapturedImage(null);
    setError('');
    setShowRawText(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Foto Maken</h3>
              <Button type="button" variant="ghost" size="sm" onClick={stopCamera}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg"
                style={{ minHeight: '300px' }}
                onLoadedMetadata={() => {
                  console.log('📺 Video ready for capture');
                  setVideoReady(true);
                }}
                onError={(e) => {
                  console.error('Video error:', e);
                  setError('Video weergave probleem');
                }}
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Loading overlay if video not ready */}
              {!videoReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Camera wordt geladen...</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-center mt-4">
              <Button type="button" onClick={capturePhoto} className="gap-2">
                <Camera className="h-4 w-4" />
                Foto Maken
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-2">
              Zorg ervoor dat de patiëntgegevens goed leesbaar zijn
            </p>
          </div>
        </div>
      )}

      {/* Upload Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            Patiëntgegevens Scannen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={startCamera}
                variant="default"
                className="flex-1 gap-2"
                disabled={isProcessing}
              >
                <Camera className="h-4 w-4" />
                Foto Maken
              </Button>
              
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1 gap-2"
                disabled={isProcessing}
              >
                <Upload className="h-4 w-4" />
                Bestand Uploaden
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <div className="text-xs text-gray-500 text-center">
              <p>Scan patiëntkaart, ID-band, of document met patiëntgegevens</p>
              <p className="mt-1">
                <span className="inline-flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Lokale verwerking - geen data wordt verzonden
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Tekst herkennen...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Captured Image */}
      {capturedImage && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileImage className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Gescande Afbeelding</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={reprocessImage}
                    disabled={isProcessing}
                    className="gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Opnieuw Scannen
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearData}
                    className="gap-1"
                  >
                    <X className="h-3 w-3" />
                    Wissen
                  </Button>
                </div>
              </div>
              
              <img
                src={capturedImage}
                alt="Gescande afbeelding"
                className="w-full max-w-md mx-auto rounded-lg border"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extracted Data */}
      {extractedData && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Geëxtraheerde Gegevens</span>
                </div>
                <Badge 
                  variant={extractedData.confidence > 70 ? "default" : "secondary"}
                  className="gap-1"
                >
                  {extractedData.confidence}% betrouwbaarheid
                </Badge>
              </div>

              {/* Extracted Patient Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Patiënt ID
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className="text-sm font-mono">
                      {extractedData.extractedData.patientId || 'Niet gevonden'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Geboortedatum
                  </label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className="text-sm">
                      {extractedData.extractedData.birthDate || 'Niet gevonden'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Alternative Candidates */}
              {(extractedData.extractedData.possibleIds.length > 1 || 
                extractedData.extractedData.possibleDates.length > 1) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Andere Mogelijkheden
                    </span>
                  </div>
                  
                  {extractedData.extractedData.possibleIds.length > 1 && (
                    <div>
                      <span className="text-xs text-gray-500">Patiënt IDs:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {extractedData.extractedData.possibleIds
                          .filter(id => id !== extractedData.extractedData.patientId)
                          .slice(0, 3)
                          .map((id, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {id}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {extractedData.extractedData.possibleDates.length > 1 && (
                    <div>
                      <span className="text-xs text-gray-500">Datums:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {extractedData.extractedData.possibleDates
                          .filter(date => date !== extractedData.extractedData.birthDate)
                          .slice(0, 3)
                          .map((date, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {date}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Raw Text Toggle */}
              <div className="border-t pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRawText(!showRawText)}
                  className="gap-2"
                >
                  {showRawText ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showRawText ? 'Verberg' : 'Toon'} Ruwe Tekst
                </Button>
                
                {showRawText && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {extractedData.rawText}
                    </pre>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    if (onDataExtracted) {
                      const formatted = ocrService.formatExtractedData(extractedData.extractedData);
                      onDataExtracted(formatted);
                    }
                  }}
                  size="sm"
                  disabled={!extractedData.extractedData.patientId && !extractedData.extractedData.birthDate}
                >
                  Gegevens Gebruiken
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearData}
                >
                  Wissen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!capturedImage && !isProcessing && (
        <Card>
          <CardContent className="p-4">
            <div className="text-center text-gray-500">
              <Scan className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <h3 className="font-medium mb-2">Patiëntgegevens Scannen</h3>
              <div className="text-sm space-y-1">
                <p>• Maak een foto van de patiëntkaart of ID-band</p>
                <p>• Zorg voor goede belichting en scherpte</p>
                <p>• Alle tekst moet goed leesbaar zijn</p>
                <p>• Gegevens worden lokaal verwerkt (GDPR-compliant)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OCRInput;

