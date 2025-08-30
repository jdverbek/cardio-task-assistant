import Dexie from 'dexie';

// Task types enum
export const TaskType = {
  CONSULT: 'consult',
  PROCEDURE_REPORT: 'procedure_report',
  ECHO_PROCEDURE: 'echo_procedure',
  ECHO_REPORT: 'echo_report',
  FOLLOW_UP: 'follow_up',
  PATIENT_CALL: 'patient_call',
  MDO_PREP: 'mdo_prep',
  CALLBACK: 'callback',
  GENERAL: 'general'
};

// Task status enum
export const TaskStatus = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  WAITING: 'waiting',
  COMPLETED: 'completed'
};

// Priority enum
export const Priority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Task type configurations
export const TaskTypeConfig = {
  [TaskType.CONSULT]: {
    name: 'Consult',
    icon: 'UserCheck',
    color: 'bg-purple-100 text-purple-800',
    description: 'Consult voor andere specialisme'
  },
  [TaskType.PROCEDURE_REPORT]: {
    name: 'Procedure Verslag',
    icon: 'FileText',
    color: 'bg-cyan-100 text-cyan-800',
    description: 'Verslag maken van procedure'
  },
  [TaskType.ECHO_PROCEDURE]: {
    name: 'Echo Procedure',
    icon: 'Activity',
    color: 'bg-blue-100 text-blue-800',
    description: 'Bedside echocardiogram (TTE)'
  },
  [TaskType.ECHO_REPORT]: {
    name: 'Echo Verslag',
    icon: 'FileHeart',
    color: 'bg-red-100 text-red-800',
    description: 'Verslag van echocardiogram (TTE/TEE)'
  },
  [TaskType.FOLLOW_UP]: {
    name: 'Follow-up',
    icon: 'RefreshCw',
    color: 'bg-green-100 text-green-800',
    description: 'Follow-up onderzoeksresultaten'
  },
  [TaskType.PATIENT_CALL]: {
    name: 'Patiënt Bellen',
    icon: 'Phone',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Patiënt bellen voor resultaten'
  },
  [TaskType.MDO_PREP]: {
    name: 'MDO Voorbereiding',
    icon: 'Users',
    color: 'bg-indigo-100 text-indigo-800',
    description: 'Multidisciplinair overleg voorbereiden'
  },
  [TaskType.CALLBACK]: {
    name: 'Terugbellen',
    icon: 'PhoneCall',
    color: 'bg-pink-100 text-pink-800',
    description: 'Iemand terugbellen'
  },
  [TaskType.GENERAL]: {
    name: 'Algemene Taak',
    icon: 'CheckSquare',
    color: 'bg-gray-100 text-gray-800',
    description: 'Algemene taak of herinnering'
  }
};

// Priority configurations
export const PriorityConfig = {
  [Priority.LOW]: {
    name: 'Laag',
    color: 'bg-gray-100 text-gray-600',
    badge: 'bg-gray-500'
  },
  [Priority.MEDIUM]: {
    name: 'Gemiddeld',
    color: 'bg-blue-100 text-blue-600',
    badge: 'bg-blue-500'
  },
  [Priority.HIGH]: {
    name: 'Hoog',
    color: 'bg-orange-100 text-orange-600',
    badge: 'bg-orange-500'
  },
  [Priority.URGENT]: {
    name: 'Urgent',
    color: 'bg-red-100 text-red-600',
    badge: 'bg-red-500'
  }
};

// Database class
class TaskDatabase extends Dexie {
  constructor() {
    super('CardioTaskManager');
    
    this.version(1).stores({
      tasks: '++id, type, status, priority, dueDate, createdAt, updatedAt, completedAt',
      templates: '++id, name, type'
    });
  }
}

// Create database instance
export const db = new TaskDatabase();

// Database service functions
export const TaskService = {
  // Create a new task
  async createTask(taskData) {
    const now = new Date();
    const task = {
      id: crypto.randomUUID(),
      type: taskData.type || TaskType.GENERAL,
      title: taskData.title,
      description: taskData.description || '',
      status: TaskStatus.PENDING,
      priority: taskData.priority || Priority.MEDIUM,
      dueDate: taskData.dueDate || null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      patientRef: taskData.patientRef || '',
      tags: taskData.tags || []
    };
    
    await db.tasks.add(task);
    return task;
  },

  // Get all tasks
  async getAllTasks() {
    return await db.tasks.orderBy('createdAt').reverse().toArray();
  },

  // Get tasks by status
  async getTasksByStatus(status) {
    return await db.tasks.where('status').equals(status).toArray();
  },

  // Get today's tasks
  async getTodaysTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await db.tasks
      .where('dueDate')
      .between(today, tomorrow, true, false)
      .or('createdAt')
      .between(today, tomorrow, true, false)
      .toArray();
  },

  // Get overdue tasks
  async getOverdueTasks() {
    const now = new Date();
    return await db.tasks
      .where('dueDate')
      .below(now)
      .and(task => task.status !== TaskStatus.COMPLETED)
      .toArray();
  },

  // Update task
  async updateTask(id, updates) {
    const updatedTask = {
      ...updates,
      updatedAt: new Date()
    };
    
    if (updates.status === TaskStatus.COMPLETED && !updates.completedAt) {
      updatedTask.completedAt = new Date();
    }
    
    await db.tasks.update(id, updatedTask);
    return await db.tasks.get(id);
  },

  // Delete task
  async deleteTask(id) {
    await db.tasks.delete(id);
  },

  // Mark task as completed
  async completeTask(id) {
    return await this.updateTask(id, {
      status: TaskStatus.COMPLETED,
      completedAt: new Date()
    });
  },

  // Search tasks
  async searchTasks(query) {
    const lowerQuery = query.toLowerCase();
    return await db.tasks
      .filter(task => 
        task.title.toLowerCase().includes(lowerQuery) ||
        task.description.toLowerCase().includes(lowerQuery) ||
        task.patientRef.toLowerCase().includes(lowerQuery) ||
        task.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .toArray();
  },

  // Get task statistics
  async getTaskStats() {
    const allTasks = await this.getAllTasks();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      total: allTasks.length,
      pending: allTasks.filter(t => t.status === TaskStatus.PENDING).length,
      inProgress: allTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      completed: allTasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      overdue: allTasks.filter(t => 
        t.dueDate && 
        new Date(t.dueDate) < today && 
        t.status !== TaskStatus.COMPLETED
      ).length,
      dueToday: allTasks.filter(t => {
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === today.getTime();
      }).length
    };

    return stats;
  }
};

// Default task templates
export const defaultTemplates = [
  {
    name: 'Cardiologie Consult',
    type: TaskType.CONSULT,
    defaultTitle: 'Cardiologie consult voor [Specialisme]',
    defaultDescription: 'Consult uitvoeren en verslag opstellen',
    defaultPriority: Priority.MEDIUM,
    tags: ['consult', 'cardiologie']
  },
  {
    name: 'Cathlab Verslag',
    type: TaskType.PROCEDURE_REPORT,
    defaultTitle: 'Cathlab procedure verslag',
    defaultDescription: 'Procedure verslag voltooien voor vandaag\'s cathlab',
    defaultPriority: Priority.HIGH,
    tags: ['cathlab', 'verslag']
  },
  {
    name: 'Bedside Echo',
    type: TaskType.ECHO_PROCEDURE,
    defaultTitle: 'Bedside echocardiogram (TTE)',
    defaultDescription: 'Bedside TTE uitvoeren',
    defaultPriority: Priority.MEDIUM,
    tags: ['echo', 'tte', 'bedside']
  },
  {
    name: 'Echo Verslag',
    type: TaskType.ECHO_REPORT,
    defaultTitle: 'Echocardiogram verslag',
    defaultDescription: 'Echo verslag voltooien (TTE/TEE)',
    defaultPriority: Priority.HIGH,
    tags: ['echo', 'verslag']
  },
  {
    name: 'Lab Follow-up',
    type: TaskType.FOLLOW_UP,
    defaultTitle: 'Follow-up lab uitslagen',
    defaultDescription: 'Lab uitslagen bekijken en follow-up',
    defaultPriority: Priority.MEDIUM,
    tags: ['lab', 'follow-up']
  },
  {
    name: 'Patiënt Gesprek',
    type: TaskType.PATIENT_CALL,
    defaultTitle: 'Patiënt bellen - uitslagen bespreken',
    defaultDescription: 'Onderzoeksresultaten en behandelplan bespreken',
    defaultPriority: Priority.HIGH,
    tags: ['patient', 'bellen', 'uitslagen']
  },
  {
    name: 'MDO Voorbereiding',
    type: TaskType.MDO_PREP,
    defaultTitle: 'MDO meeting voorbereiden',
    defaultDescription: 'Cases en materialen voorbereiden voor multidisciplinair overleg',
    defaultPriority: Priority.MEDIUM,
    tags: ['mdo', 'meeting', 'voorbereiding']
  }
];

