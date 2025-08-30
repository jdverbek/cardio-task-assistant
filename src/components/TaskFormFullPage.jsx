import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import SpeechInput from './SpeechInput.jsx';
import OCRInput from './OCRInput.jsx';
import { 
  TaskType, 
  TaskTypeConfig, 
  Priority, 
  PriorityConfig,
  defaultTemplates 
} from '../lib/database.js';

const TaskFormFullPage = ({ 
  onClose, 
  onSubmit, 
  task = null, 
  isEditing = false
}) => {
  const [formData, setFormData] = useState({
    type: TaskType.GENERAL,
    title: '',
    description: '',
    priority: Priority.MEDIUM,
    dueDate: '',
    dueTime: '',
    patientRef: '',
    tags: []
  });
  
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    if (task) {
      setFormData({
        type: task.type || TaskType.GENERAL,
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || Priority.MEDIUM,
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        dueTime: task.dueDate ? format(new Date(task.dueDate), 'HH:mm') : '',
        patientRef: task.patientRef || '',
        tags: task.tags || []
      });
    }
  }, [task]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      type: template.type,
      title: template.name,
      description: template.description || '',
      priority: template.priority || Priority.MEDIUM
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Combine date and time
    let dueDateTime = null;
    if (formData.dueDate) {
      dueDateTime = new Date(formData.dueDate);
      if (formData.dueTime) {
        const [hours, minutes] = formData.dueTime.split(':');
        dueDateTime.setHours(parseInt(hours), parseInt(minutes));
      }
    }

    const taskData = {
      type: formData.type,
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      dueDate: dueDateTime,
      patientRef: formData.patientRef.trim(),
      tags: formData.tags
    };

    onSubmit(taskData);
  };

  const isFormValid = formData.title.trim().length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quick Templates (only for new tasks) */}
      {!isEditing && (
        <div className="space-y-3">
          <Label>Snelle Sjablonen</Label>
          <div className="grid grid-cols-2 gap-2">
            {defaultTemplates.slice(0, 6).map((template) => (
              <Button
                key={template.name}
                type="button"
                variant={selectedTemplate?.name === template.name ? "default" : "outline"}
                size="sm"
                onClick={() => handleTemplateSelect(template)}
                className="justify-start text-left h-auto p-3"
              >
                <div>
                  <div className="font-medium text-xs">{template.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {TaskTypeConfig[template.type].description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Task Type */}
      <div className="space-y-2">
        <Label htmlFor="type">Taak Type</Label>
        <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TaskTypeConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded ${config.color.split(' ')[0]}`} />
                  <span>{config.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Title with Speech Input */}
      <div className="space-y-2">
        <Label htmlFor="title">Titel *</Label>
        <div className="flex gap-2">
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Voer taak titel in..."
            className="flex-1"
          />
        </div>
        <SpeechInput
          onTranscription={(text) => handleInputChange('title', text)}
          placeholder="Spreek de taak titel"
          className="mt-2"
        />
      </div>

      {/* Description with Speech Input */}
      <div className="space-y-2">
        <Label htmlFor="description">Beschrijving</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Voeg details toe over de taak..."
          rows={4}
        />
        <SpeechInput
          onTranscription={(text) => handleInputChange('description', text)}
          placeholder="Spreek de taak beschrijving"
          className="mt-2"
        />
      </div>

      {/* Patient Reference with OCR */}
      <div className="space-y-2">
        <Label htmlFor="patientRef">Patiënt Referentie</Label>
        <Input
          id="patientRef"
          value={formData.patientRef}
          onChange={(e) => handleInputChange('patientRef', e.target.value)}
          placeholder="Patiënt ID, kamer nummer, etc."
        />
        <div className="flex gap-2">
          <SpeechInput
            onTranscription={(text) => handleInputChange('patientRef', text)}
            placeholder="Spreek patiënt referentie"
            className="flex-1"
          />
          <OCRInput
            onDataExtracted={(data) => {
              if (data.patientId) {
                handleInputChange('patientRef', data.patientId);
              }
            }}
            className="flex-1"
          />
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label htmlFor="priority">Prioriteit</Label>
        <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PriorityConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded ${config.color.split(' ')[0]}`} />
                  <span>{config.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Due Date and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Vervaldatum</Label>
          <div className="relative">
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dueTime">Tijd</Label>
          <div className="relative">
            <Input
              id="dueTime"
              type="time"
              value={formData.dueTime}
              onChange={(e) => handleInputChange('dueTime', e.target.value)}
            />
            <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={formData.tags.join(', ')}
          onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
          placeholder="Voer tags in, gescheiden door komma's"
        />
        <SpeechInput
          onTranscription={(text) => {
            const newTags = text.split(',').map(tag => tag.trim()).filter(Boolean);
            handleInputChange('tags', newTags);
          }}
          placeholder="Spreek tags in"
          className="mt-2"
        />
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {formData.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          ← Terug
        </Button>
        <Button type="submit" disabled={!isFormValid}>
          {isEditing ? 'Taak Bijwerken' : 'Taak Aanmaken'}
        </Button>
      </div>
    </form>
  );
};

export default TaskFormFullPage;

