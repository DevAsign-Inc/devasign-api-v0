import apiClient from './apiConfig';

export const taskService = {
  // Get all tasks for a project
  getProjectTasks: async (projectId) => {
    try {
      const response = await apiClient.get(`/projects/${projectId}/tasks`);
      return response.data;
    } catch (error) {
      console.error(`Get tasks for project ${projectId} error:`, error);
      throw error;
    }
  },
  
  // Get all tasks across projects for current user
  getAllTasks: async () => {
    try {
      const response = await apiClient.get('/tasks');
      return response.data;
    } catch (error) {
      console.error('Get all tasks error:', error);
      throw error;
    }
  },
  
  // Get a specific task by ID
  getTask: async (taskId) => {
    try {
      const response = await apiClient.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error(`Get task ${taskId} error:`, error);
      throw error;
    }
  },
  
  // Create a new task in a project
  createTask: async (projectId, taskData) => {
    try {
      const response = await apiClient.post(`/projects/${projectId}/tasks`, taskData);
      return response.data;
    } catch (error) {
      console.error(`Create task in project ${projectId} error:`, error);
      throw error;
    }
  },
  
  // Update a task
  updateTask: async (taskId, taskData) => {
    try {
      const response = await apiClient.put(`/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      console.error(`Update task ${taskId} error:`, error);
      throw error;
    }
  },
  
  // Delete a task
  deleteTask: async (taskId) => {
    try {
      const response = await apiClient.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error(`Delete task ${taskId} error:`, error);
      throw error;
    }
  }
};