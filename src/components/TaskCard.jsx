import React from 'react';
import { format, isToday, isPast } from 'date-fns';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Card, CardContent, CardHeader } from '@/components/ui/card.jsx';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu.jsx';
import { TaskTypeConfig, PriorityConfig, TaskStatus } from '../lib/database.js';

const TaskCard = ({ 
  task, 
  onComplete, 
  onToggleStatus, 
  onEdit, 
  onDelete,
  className = '' 
}) => {
  const typeConfig = TaskTypeConfig[task.type];
  const priorityConfig = PriorityConfig[task.priority];
  
  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isCompleted;
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  const handleStatusToggle = (e) => {
    e.stopPropagation();
    if (isCompleted) {
      onComplete?.(task.id);
    } else {
      onToggleStatus?.(task.id);
    }
  };

  const handleComplete = (e) => {
    e.stopPropagation();
    onComplete?.(task.id);
  };

  const getStatusIcon = () => {
    if (isCompleted) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    
    if (task.status === TaskStatus.IN_PROGRESS) {
      return <Clock className="h-5 w-5 text-blue-600" />;
    }
    
    if (isOverdue) {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
    
    return <Circle className="h-5 w-5 text-gray-400" />;
  };

  const getCardBorder = () => {
    if (isCompleted) return 'border-green-200';
    if (isOverdue) return 'border-red-300';
    if (isDueToday) return 'border-orange-300';
    if (task.status === TaskStatus.IN_PROGRESS) return 'border-blue-300';
    return 'border-gray-200';
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${getCardBorder()} ${className} ${
      isCompleted ? 'opacity-75' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <button
              onClick={handleStatusToggle}
              className="mt-1 hover:scale-110 transition-transform"
            >
              {getStatusIcon()}
            </button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Badge variant="secondary" className={typeConfig.color}>
                  {typeConfig.name}
                </Badge>
                
                <div className={`w-2 h-2 rounded-full ${priorityConfig.badge}`} />
                
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">
                    Overdue
                  </Badge>
                )}
                
                {isDueToday && !isOverdue && (
                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                    Due Today
                  </Badge>
                )}
              </div>
              
              <h3 className={`font-medium text-sm leading-tight ${
                isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
              }`}>
                {task.title}
              </h3>
              
              {task.description && (
                <p className={`text-xs mt-1 ${
                  isCompleted ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {task.description.length > 100 
                    ? `${task.description.substring(0, 100)}...` 
                    : task.description
                  }
                </p>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isCompleted && (
                <DropdownMenuItem onClick={handleComplete}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Complete
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit?.(task)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete?.(task.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            {task.dueDate && (
              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                Due: {format(new Date(task.dueDate), 'MMM d, h:mm a')}
              </span>
            )}
            
            {task.patientRef && (
              <span>Ref: {task.patientRef}</span>
            )}
          </div>
          
          <span>
            {format(new Date(task.createdAt), 'MMM d')}
          </span>
        </div>
        
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {task.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{task.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCard;

