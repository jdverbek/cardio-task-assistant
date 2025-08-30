import { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskService, TaskStatus } from '../lib/database.js';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all tasks
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const allTasks = await TaskService.getAllTasks();
      setTasks(allTasks);
      setError(null);
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new task
  const createTask = useCallback(async (taskData) => {
    try {
      const newTask = await TaskService.createTask(taskData);
      setTasks(prev => [newTask, ...prev]);
      return newTask;
    } catch (err) {
      setError('Failed to create task');
      console.error('Error creating task:', err);
      throw err;
    }
  }, []);

  // Update a task
  const updateTask = useCallback(async (id, updates) => {
    try {
      const updatedTask = await TaskService.updateTask(id, updates);
      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));
      return updatedTask;
    } catch (err) {
      setError('Failed to update task');
      console.error('Error updating task:', err);
      throw err;
    }
  }, []);

  // Delete a task
  const deleteTask = useCallback(async (id) => {
    try {
      await TaskService.deleteTask(id);
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
      throw err;
    }
  }, []);

  // Complete a task
  const completeTask = useCallback(async (id) => {
    try {
      const completedTask = await TaskService.completeTask(id);
      setTasks(prev => prev.map(task => 
        task.id === id ? completedTask : task
      ));
      return completedTask;
    } catch (err) {
      setError('Failed to complete task');
      console.error('Error completing task:', err);
      throw err;
    }
  }, []);

  // Toggle task status between pending and in progress
  const toggleTaskStatus = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === TaskStatus.PENDING 
      ? TaskStatus.IN_PROGRESS 
      : TaskStatus.PENDING;

    return await updateTask(id, { status: newStatus });
  }, [tasks, updateTask]);

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    toggleTaskStatus,
    refreshTasks: loadTasks
  };
};

export const useTaskStats = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    dueToday: 0
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const taskStats = await TaskService.getTaskStats();
      setStats(taskStats);
    } catch (err) {
      console.error('Error loading task stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    
    // Refresh stats every minute
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, [loadStats]);

  return { stats, loading, refreshStats: loadStats };
};

export const useTaskFilters = (tasks) => {
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    search: ''
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status filter
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      // Type filter
      if (filters.type !== 'all' && task.type !== filters.type) {
        return false;
      }

      // Priority filter
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          task.title.toLowerCase().includes(searchLower) ||
          task.description.toLowerCase().includes(searchLower) ||
          task.patientRef.toLowerCase().includes(searchLower) ||
          task.tags.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, filters]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      type: 'all',
      priority: 'all',
      search: ''
    });
  }, []);

  return {
    filters,
    filteredTasks,
    updateFilter,
    clearFilters
  };
};

