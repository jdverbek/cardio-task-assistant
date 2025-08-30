import React, { useState, useEffect } from 'react';
import { format, isToday, isPast } from 'date-fns';
import { nl } from 'date-fns/locale';
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Progress } from '@/components/ui/progress.jsx';
import { useTasks, useTaskStats } from '../hooks/useTasks.js';
import { TaskStatus, TaskTypeConfig } from '../lib/database.js';
import TaskCard from './TaskCard.jsx';
import TaskForm from './TaskForm.jsx';

const Dashboard = () => {
  const { tasks, createTask, updateTask, deleteTask, completeTask, toggleTaskStatus } = useTasks();
  const { stats, loading: statsLoading } = useTaskStats();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Get today's tasks
  const todaysTasks = tasks.filter(task => {
    if (task.status === TaskStatus.COMPLETED) return false;
    
    // Tasks due today
    if (task.dueDate && isToday(new Date(task.dueDate))) return true;
    
    // Tasks created today
    if (isToday(new Date(task.createdAt))) return true;
    
    return false;
  });

  // Get overdue tasks
  const overdueTasks = tasks.filter(task => 
    task.dueDate && 
    isPast(new Date(task.dueDate)) && 
    task.status !== TaskStatus.COMPLETED
  );

  // Get urgent tasks
  const urgentTasks = tasks.filter(task => 
    task.priority === 'urgent' && 
    task.status !== TaskStatus.COMPLETED
  );

  // Get in-progress tasks
  const inProgressTasks = tasks.filter(task => 
    task.status === TaskStatus.IN_PROGRESS
  );

  // Calculate completion rate
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const handleCreateTask = async (taskData) => {
    try {
      await createTask(taskData);
      setShowTaskForm(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleEditTask = async (taskData) => {
    try {
      await updateTask(editingTask.id, taskData);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Weet je zeker dat je deze taak wilt verwijderen?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  const TaskSection = ({ title, tasks, emptyMessage, maxItems = 5 }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, maxItems).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={completeTask}
                onToggleStatus={toggleTaskStatus}
                onEdit={setEditingTask}
                onDelete={handleDeleteTask}
                className="shadow-sm"
              />
            ))}
            {tasks.length > maxItems && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                +{tasks.length - maxItems} meer taken
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: nl })}
          </p>
        </div>
        <Button onClick={() => setShowTaskForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Taak Toevoegen
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Totaal Taken"
          value={stats.total}
          icon={Calendar}
          color="text-blue-600"
          description="Alle tijd"
        />
        <StatCard
          title="In Behandeling"
          value={stats.pending}
          icon={Clock}
          color="text-orange-600"
          description="Wacht op actie"
        />
        <StatCard
          title="Achterstallig"
          value={stats.overdue}
          icon={AlertTriangle}
          color="text-red-600"
          description="Over vervaldatum"
        />
        <StatCard
          title="Voltooid"
          value={stats.completed}
          icon={CheckCircle}
          color="text-green-600"
          description={`${completionRate}% voltooiingspercentage`}
        />
      </div>

      {/* Progress Overview */}
      {stats.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Voortgangsoverzicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Algehele Voltooiing</span>
                  <span>{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">{stats.pending}</div>
                  <div className="text-muted-foreground">In Behandeling</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">{stats.inProgress}</div>
                  <div className="text-muted-foreground">Bezig</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">{stats.overdue}</div>
                  <div className="text-muted-foreground">Achterstallig</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{stats.completed}</div>
                  <div className="text-muted-foreground">Voltooid</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Tasks */}
        {urgentTasks.length > 0 && (
          <TaskSection
            title="🚨 Urgente Taken"
            tasks={urgentTasks}
            emptyMessage="Geen urgente taken"
            maxItems={3}
          />
        )}

        {/* Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <TaskSection
            title="⏰ Achterstallige Taken"
            tasks={overdueTasks}
            emptyMessage="Geen achterstallige taken"
            maxItems={3}
          />
        )}

        {/* Today's Tasks */}
        <TaskSection
          title="📅 Taken van Vandaag"
          tasks={todaysTasks}
          emptyMessage="Geen taken voor vandaag"
          maxItems={4}
        />

        {/* In Progress */}
        <TaskSection
          title="🔄 Bezig"
          tasks={inProgressTasks}
          emptyMessage="Geen taken in behandeling"
          maxItems={4}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Snelle Acties</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowTaskForm(true)}
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm">Nieuwe Taak</span>
            </Button>
            
            <Button 
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => {
                // Quick template for consult
                setShowTaskForm(true);
              }}
            >
              <div className="h-6 w-6 bg-purple-100 rounded flex items-center justify-center">
                <span className="text-purple-600 text-xs font-bold">C</span>
              </div>
              <span className="text-sm">Consult</span>
            </Button>
            
            <Button 
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => setShowTaskForm(true)}
            >
              <div className="h-6 w-6 bg-cyan-100 rounded flex items-center justify-center">
                <span className="text-cyan-600 text-xs font-bold">V</span>
              </div>
              <span className="text-sm">Verslag</span>
            </Button>
            
            <Button 
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => setShowTaskForm(true)}
            >
              <div className="h-6 w-6 bg-green-100 rounded flex items-center justify-center">
                <span className="text-green-600 text-xs font-bold">F</span>
              </div>
              <span className="text-sm">Follow-up</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task Forms */}
      <TaskForm
        isOpen={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onSubmit={handleCreateTask}
      />

      <TaskForm
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={handleEditTask}
        task={editingTask}
        isEditing={true}
      />
    </div>
  );
};

export default Dashboard;

