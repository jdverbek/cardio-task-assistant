import React, { useState, useEffect } from 'react';
import {
  Shield,
  Clock,
  Trash2,
  BarChart3,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Calendar,
  Database,
  Eye,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { dataRetentionService } from '../lib/dataRetentionService.js';

const DataRetentionStatus = ({ isOpen, onClose }) => {
  const [retentionStatus, setRetentionStatus] = useState(null);
  const [dataStats, setDataStats] = useState(null);
  const [cleanupHistory, setCleanupHistory] = useState([]);
  const [isManualCleanup, setIsManualCleanup] = useState(false);
  const [activeTab, setActiveTab] = useState('status');

  useEffect(() => {
    if (isOpen) {
      loadData();
      const interval = setInterval(loadData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [status, stats, history] = await Promise.all([
        dataRetentionService.getRetentionStatus(),
        dataRetentionService.getDataAgeStatistics(),
        dataRetentionService.getCleanupHistory()
      ]);
      
      setRetentionStatus(status);
      setDataStats(stats);
      setCleanupHistory(history);
    } catch (error) {
      console.error('Error loading retention data:', error);
    }
  };

  const handleManualCleanup = async () => {
    setIsManualCleanup(true);
    try {
      await dataRetentionService.triggerManualCleanup();
      await loadData(); // Refresh data after cleanup
    } catch (error) {
      console.error('Error during manual cleanup:', error);
    } finally {
      setIsManualCleanup(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Onbekend';
    return new Date(dateString).toLocaleString('nl-NL');
  };

  const formatTimeUntil = (futureDate) => {
    if (!futureDate) return 'Onbekend';
    
    const now = new Date();
    const target = new Date(futureDate);
    const diffMs = target.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Nu';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}u ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold">GDPR Data Beheer</h2>
              <p className="text-sm text-gray-600">
                Automatische verwijdering van gegevens na 72 uur
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'status'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Status
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'statistics'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Statistieken
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'history'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Geschiedenis
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'status' && retentionStatus && (
            <div className="space-y-6">
              {/* GDPR Compliance Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    GDPR Compliance Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">Automatische Verwijdering</div>
                        <div className="text-sm text-gray-600">
                          {retentionStatus.isRunning ? 'Actief' : 'Inactief'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">Bewaarperiode</div>
                        <div className="text-sm text-gray-600">
                          {retentionStatus.retentionPeriodHours} uur
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Cleanup */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    Volgende Opruiming
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Geplande tijd:</span>
                      <span className="font-medium">
                        {formatDateTime(retentionStatus.nextCleanupTime)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Over:</span>
                      <Badge variant="secondary">
                        {formatTimeUntil(retentionStatus.nextCleanupTime)}
                      </Badge>
                    </div>
                    
                    <div className="pt-2">
                      <Button
                        onClick={handleManualCleanup}
                        disabled={isManualCleanup}
                        size="sm"
                        className="gap-2"
                      >
                        {isManualCleanup ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        {isManualCleanup ? 'Bezig...' : 'Nu Opruimen'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Last Cleanup Results */}
              {retentionStatus.lastCleanupResults && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                      Laatste Opruiming
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Tijdstip:</span>
                        <span>{formatDateTime(retentionStatus.lastCleanupResults.timestamp)}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="text-center p-3 bg-blue-50 rounded-md">
                          <div className="text-lg font-bold text-blue-600">
                            {retentionStatus.lastCleanupResults.tasksDeleted}
                          </div>
                          <div className="text-xs text-gray-600">Taken</div>
                        </div>
                        
                        <div className="text-center p-3 bg-green-50 rounded-md">
                          <div className="text-lg font-bold text-green-600">
                            {retentionStatus.lastCleanupResults.audioFilesDeleted}
                          </div>
                          <div className="text-xs text-gray-600">Audio bestanden</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'statistics' && dataStats && (
            <div className="space-y-6">
              {/* Data Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold">{dataStats.tasks.total}</div>
                    <div className="text-sm text-gray-600">Totaal Taken</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-amber-600" />
                    <div className="text-2xl font-bold">{dataStats.tasks.old}</div>
                    <div className="text-sm text-gray-600">Oude Taken (&gt;72u)</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold">{dataStats.tasks.recent}</div>
                    <div className="text-sm text-gray-600">Recente Taken</div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Gedetailleerde Statistieken</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Tasks */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Taken</span>
                        <span className="text-sm text-gray-600">
                          {dataStats.tasks.total} totaal
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ 
                            width: `${dataStats.tasks.total > 0 ? 
                              (dataStats.tasks.recent / dataStats.tasks.total) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{dataStats.tasks.recent} recent</span>
                        <span>{dataStats.tasks.old} oud</span>
                      </div>
                    </div>

                    {/* Audio Files */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Audio Bestanden</span>
                        <span className="text-sm text-gray-600">
                          {dataStats.audioFiles.total} totaal
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ 
                            width: `${dataStats.audioFiles.total > 0 ? 
                              (dataStats.audioFiles.recent / dataStats.audioFiles.total) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{dataStats.audioFiles.recent} recent</span>
                        <span>{dataStats.audioFiles.old} oud</span>
                      </div>
                    </div>

                    {/* OCR Data */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">OCR Gegevens</span>
                        <span className="text-sm text-gray-600">
                          {dataStats.ocrData.total} totaal
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ 
                            width: `${dataStats.ocrData.total > 0 ? 
                              (dataStats.ocrData.recent / dataStats.ocrData.total) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{dataStats.ocrData.recent} recent</span>
                        <span>{dataStats.ocrData.old} oud</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Opruiming Geschiedenis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {cleanupHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Trash2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nog geen opruimingen uitgevoerd</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cleanupHistory.slice().reverse().map((entry, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">
                              {formatDateTime(entry.timestamp)}
                            </span>
                            <Badge variant="outline">
                              {entry.retentionPeriodHours}u bewaarperiode
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <div className="font-bold text-blue-600">
                                {entry.tasksDeleted}
                              </div>
                              <div className="text-xs text-gray-600">Taken</div>
                            </div>
                            
                            <div className="text-center p-2 bg-green-50 rounded">
                              <div className="font-bold text-green-600">
                                {entry.audioFilesDeleted}
                              </div>
                              <div className="text-xs text-gray-600">Audio</div>
                            </div>
                            
                            <div className="text-center p-2 bg-purple-50 rounded">
                              <div className="font-bold text-purple-600">
                                {entry.ocrDataDeleted}
                              </div>
                              <div className="text-xs text-gray-600">OCR</div>
                            </div>
                            
                            <div className="text-center p-2 bg-orange-50 rounded">
                              <div className="font-bold text-orange-600">
                                {entry.vocabularyCorrectionsDeleted}
                              </div>
                              <div className="text-xs text-gray-600">Correcties</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="h-4 w-4" />
            <span>GDPR-compliant automatische data verwijdering</span>
          </div>
          
          <Button onClick={onClose}>
            Sluiten
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataRetentionStatus;

