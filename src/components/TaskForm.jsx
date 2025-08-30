import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Calendar, Clock } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  TaskType, 
  TaskTypeConfig, 
  Priority, 
  PriorityConfig,
  defaultTemplates 
} from '../lib/database.js';

const TaskForm = ({ 
  isOpen, 
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
  const [tagInput, setTagInput] = useState('');

  // Initialize form data
  useEffect(() => {
    if (task && isEditing) {
      setFormData({
        type: task.type,
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        dueTime: task.dueDate ? format(new Date(task.dueDate), 'HH:mm') : '',
        patientRef: task.patientRef || '',
        tags: task.tags || []
      });
    } else {
      // Reset form for new task
      setFormData({
        type: TaskType.GENERAL,
        title: '',
        description: '',
        priority: Priority.MEDIUM,
        dueDate: '',
        dueTime: '',
        patientRef: '',
        tags: []
      });
    }
    setSelectedTemplate(null);
    setTagInput('');
  }, [task, isEditing, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      type: template.type,
      title: template.defaultTitle,
      description: template.defaultDescription || '',
      priority: template.defaultPriority,
      tags: [...template.tags]
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quick Templates (only for new tasks) */}
          {!isEditing && (
            <div className="space-y-3">
              <Label>Quick Templates</Label>
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
            <Label htmlFor="type">Task Type</Label>
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

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title..."
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Add details about the task..."
              rows={3}
            />
          </div>

          {/* Priority and Due Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PriorityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${config.badge}`} />
                        <span>{config.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <div className="flex space-x-2">
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => handleInputChange('dueTime', e.target.value)}
                  className="w-24"
                />
              </div>
            </div>
          </div>

          {/* Patient Reference */}
          <div className="space-y-2">
            <Label htmlFor="patientRef">Patient Reference</Label>
            <Input
              id="patientRef"
              value={formData.patientRef}
              onChange={(e) => handleInputChange('patientRef', e.target.value)}
              placeholder="Patient ID, room number, etc. (no personal info)"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex space-x-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" onClick={handleAddTag} size="sm">
                Add
              </Button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid}>
              {isEditing ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TaskForm;

