import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Settings, 
  Shield, 
  BookOpen,
  Menu,
  X,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import Dashboard from './components/Dashboard.jsx';
import TaskForm from './components/TaskForm.jsx';
import TaskFormFullPage from './components/TaskFormFullPage.jsx';
import VocabularyManager from './components/VocabularyManager.jsx';
import DataRetentionStatus from './components/DataRetentionStatus.jsx';
import { dataRetentionService } from './lib/dataRetentionService.js';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'new-task', 'vocabulary', 'gdpr'
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    // Initialize data retention service
    dataRetentionService.initialize();
    
    // Set up data deletion callback
    dataRetentionService.setCallbacks({
      onDataDeleted: (results) => {
        console.log('Data automatisch verwijderd:', results);
      },
      onError: (error) => {
        console.error('Data retention error:', error);
      }
    });

    return () => {
      dataRetentionService.shutdown();
    };
  }, []);

  const handleEditTask = (task) => {
    setEditingTask(task);
    setCurrentView('new-task');
  };

  const handleCloseTaskForm = () => {
    setEditingTask(null);
    setCurrentView('dashboard');
  };

  const handleTaskSubmit = (taskData) => {
    // Task submission logic here
    console.log('Task submitted:', taskData);
    setEditingTask(null);
    setCurrentView('dashboard');
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setCurrentView('new-task');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Cardiologie Taakbeheer
                </h1>
                <p className="text-sm text-gray-500 hidden sm:block">
                  AIOS Taakbeheersysteem • Spraakherkenning • OCR • GDPR-compliant
                </p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('vocabulary')}
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Woordenboek
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('gdpr')}
                className="gap-2"
              >
                <Shield className="h-4 w-4" />
                GDPR
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={handleNewTask}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Nieuwe Taak
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileMenu(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-4 space-y-3">
              <Button
                onClick={() => {
                  handleNewTask();
                  setShowMobileMenu(false);
                }}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Nieuwe Taak
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setShowVocabularyManager(true);
                  setShowMobileMenu(false);
                }}
                className="w-full gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Woordenboek Beheer
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setShowDataRetention(true);
                  setShowMobileMenu(false);
                }}
                className="w-full gap-2"
              >
                <Shield className="h-4 w-4" />
                GDPR Status
              </Button>
              
              <Button
                variant="outline"
                className="w-full gap-2"
              >
                <Settings className="h-4 w-4" />
                Instellingen
              </Button>
            </div>
            
            <div className="absolute bottom-4 left-4 right-4">
              <div className="text-xs text-gray-500 text-center">
                <p>🔒 Gegevens worden automatisch</p>
                <p>verwijderd na 72 uur (GDPR)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && (
          <Dashboard onEditTask={handleEditTask} />
        )}
        
        {currentView === 'new-task' && (
          <div className="space-y-6">
            {/* Back Button */}
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentView('dashboard')}
                className="gap-2"
              >
                ← Terug naar Dashboard
              </Button>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTask ? 'Taak Bewerken' : 'Nieuwe Taak Aanmaken'}
              </h2>
            </div>
            
            {/* Full Page Task Form */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <TaskFormFullPage
                onClose={handleCloseTaskForm}
                onSubmit={handleTaskSubmit}
                task={editingTask}
                isEditing={!!editingTask}
              />
            </div>
          </div>
        )}
        
        {currentView === 'vocabulary' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentView('dashboard')}
                className="gap-2"
              >
                ← Terug naar Dashboard
              </Button>
              <h2 className="text-2xl font-bold text-gray-900">Woordenboek Beheer</h2>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <VocabularyManager
                onClose={() => setCurrentView('dashboard')}
              />
            </div>
          </div>
        )}
        
        {currentView === 'gdpr' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentView('dashboard')}
                className="gap-2"
              >
                ← Terug naar Dashboard
              </Button>
              <h2 className="text-2xl font-bold text-gray-900">GDPR & Privacy</h2>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <DataRetentionStatus
                onClose={() => setCurrentView('dashboard')}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>GDPR-compliant • Lokale opslag • Automatische verwijdering na 72u</span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Cardiologie Taakbeheer v2.0</span>
              <span>•</span>
              <span>Met spraakherkenning & OCR</span>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-400 mt-4">
            <p>
              Geen patiëntgegevens worden verzonden naar externe servers • 
              Alle verwerking gebeurt lokaal in je browser
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

