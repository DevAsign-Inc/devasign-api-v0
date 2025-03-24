import apiClient from './apiConfig';

// Define interfaces for task data structures
interface TaskData {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'todo' | 'in-progress' | 'review' | 'completed' | 'approved' | 'rejected';
  dueDate?: string;
  assignedTo?: string;
  compensation?: string;
  action?: string;
  expectedCompletion?: string;
  isOnChain?: boolean;
  contractTxHash?: string;
  [key: string]: any;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
  project: string;
  assignedTo?: string | { _id: string; name: string; stellarAddress: string };
  createdBy: string | { _id: string; name: string; stellarAddress: string };
  createdAt: string;
  updatedAt: string;
  compensation?: string;
  applicants?: string[];
  completionDate?: string;
  isOnChain?: boolean;
  contractTxHash?: string;
  [key: string]: any;
}

interface TaskResponse {
  success: boolean;
  data: Task | Task[];
  count?: number;
  error?: string;
}

export const taskService = {
  // Get all tasks for a project
  getProjectTasks: async (projectId: string): Promise<{ success: boolean; data: Task[]; count?: number; error?: string }> => {
    try {
      const response = await apiClient.get(`/projects/${projectId}/tasks`);
      return response.data;
    } catch (error: any) {
      console.error(`Get tasks for project ${projectId} error:`, error);
      return {
        success: false,
        data: [],
        error: error.friendlyMessage || error.message || `Failed to get tasks for project ${projectId}`
      };
    }
  },
  
  // Get all tasks across projects for current user
  getAllTasks: async (): Promise<{ success: boolean; data: Task[]; count?: number; error?: string }> => {
    try {
      const response = await apiClient.get('/tasks');
      return response.data;
    } catch (error: any) {
      console.error('Get all tasks error:', error);
      return {
        success: false,
        data: [],
        error: error.friendlyMessage || error.message || 'Failed to get all tasks'
      };
    }
  },
  
  // Get a specific task by ID
  getTask: async (taskId: string): Promise<{ success: boolean; data: Task; error?: string }> => {
    try {
      const response = await apiClient.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Get task ${taskId} error:`, error);
      return {
        success: false,
        data: {} as Task,
        error: error.friendlyMessage || error.message || `Failed to get task ${taskId}`
      };
    }
  },
  
  // Create a new task in a project
  createTask: async (projectId: string, taskData: TaskData): Promise<{ success: boolean; data: Task; error?: string }> => {
    try {
      const response = await apiClient.post(`/projects/${projectId}/tasks`, taskData);
      return response.data;
    } catch (error: any) {
      console.error(`Create task in project ${projectId} error:`, error);
      return {
        success: false,
        data: {} as Task,
        error: error.friendlyMessage || error.message || `Failed to create task in project ${projectId}`
      };
    }
  },
  
  // Update a task
  updateTask: async (taskId: string, taskData: TaskData): Promise<{ success: boolean; data: Task; error?: string }> => {
    try {
      const response = await apiClient.put(`/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error: any) {
      console.error(`Update task ${taskId} error:`, error);
      return {
        success: false,
        data: {} as Task,
        error: error.friendlyMessage || error.message || `Failed to update task ${taskId}`
      };
    }
  },
  
  // Delete a task
  deleteTask: async (taskId: string): Promise<{ success: boolean; data: {}; error?: string }> => {
    try {
      const response = await apiClient.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Delete task ${taskId} error:`, error);
      return {
        success: false,
        data: {},
        error: error.friendlyMessage || error.message || `Failed to delete task ${taskId}`
      };
    }
  },
  
  // Apply for a task
  applyForTask: async (taskId: string, expectedCompletion: Date | string): Promise<{ success: boolean; data: Task; error?: string }> => {
    try {
      const response = await apiClient.put(`/tasks/${taskId}`, {
        action: 'apply',
        expectedCompletion: typeof expectedCompletion === 'string' 
          ? expectedCompletion 
          : expectedCompletion.toISOString()
      });
      return response.data;
    } catch (error: any) {
      console.error(`Apply for task ${taskId} error:`, error);
      return {
        success: false,
        data: {} as Task,
        error: error.friendlyMessage || error.message || `Failed to apply for task ${taskId}`
      };
    }
  },
  
  // Start a task (for assigned developer)
  startTask: async (taskId: string): Promise<{ success: boolean; data: Task; error?: string }> => {
    try {
      const response = await apiClient.put(`/tasks/${taskId}`, {
        action: 'start',
        status: 'in-progress'
      });
      return response.data;
    } catch (error: any) {
      console.error(`Start task ${taskId} error:`, error);
      return {
        success: false,
        data: {} as Task,
        error: error.friendlyMessage || error.message || `Failed to start task ${taskId}`
      };
    }
  },
  
  // Mark task as completed (for assigned developer)
  completeTask: async (taskId: string): Promise<{ success: boolean; data: Task; error?: string }> => {
    try {
      const response = await apiClient.put(`/tasks/${taskId}`, {
        action: 'complete',
        status: 'completed',
        completionDate: new Date().toISOString()
      });
      return response.data;
    } catch (error: any) {
      console.error(`Complete task ${taskId} error:`, error);
      return {
        success: false,
        data: {} as Task,
        error: error.friendlyMessage || error.message || `Failed to complete task ${taskId}`
      };
    }
  }
};