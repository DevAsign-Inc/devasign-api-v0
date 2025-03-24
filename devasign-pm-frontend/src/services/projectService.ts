import apiClient from './apiConfig';

export const projectService = {
  // Get all projects for the user
  getProjects: async () => {
    try {
      const response = await apiClient.get('/projects');
      return response.data;
    } catch (error) {
      console.error('Get projects error:', error);
      throw error;
    }
  },
  
  // Get a specific project by ID
  getProject: async (projectId) => {
    try {
      const response = await apiClient.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`Get project ${projectId} error:`, error);
      throw error;
    }
  },
  
  // Create a new project
  createProject: async (projectData) => {
    try {
      const response = await apiClient.post('/projects', projectData);
      return response.data;
    } catch (error) {
      console.error('Create project error:', error);
      throw error;
    }
  },
  
  // Update an existing project
  updateProject: async (projectId, projectData) => {
    try {
      const response = await apiClient.put(`/projects/${projectId}`, projectData);
      return response.data;
    } catch (error) {
      console.error(`Update project ${projectId} error:`, error);
      throw error;
    }
  },
  
  // Delete a project
  deleteProject: async (projectId) => {
    try {
      const response = await apiClient.delete(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`Delete project ${projectId} error:`, error);
      throw error;
    }
  }
};