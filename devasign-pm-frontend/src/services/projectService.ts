import apiClient from './apiConfig';

// Define interfaces for request and response types
interface ProjectData {
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  repositoryUrl?: string;
  budget?: number;
  status?: string;
  isOnChain?: boolean;
  contractTxHash?: string;
  [key: string]: any;
}

interface ProjectResponse {
  success: boolean;
  data: Project | Project[];
  count?: number;
  error?: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  status: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  owner: string | { _id: string; name: string; stellarAddress: string };
  team?: Array<string | { _id: string; name: string; stellarAddress: string }>;
  repositoryUrl?: string;
  isOnChain?: boolean;
  contractTxHash?: string;
  tasks?: string[];
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export const projectService = {
  // Get all projects for the user
  getProjects: async (): Promise<{ success: boolean; data: Project[]; count?: number; error?: string }> => {
    try {
      const response = await apiClient.get('/projects');
      return response.data;
    } catch (error: any) {
      console.error('Get projects error:', error);
      return {
        success: false,
        data: [],
        error: error.friendlyMessage || error.message || 'Failed to get projects'
      };
    }
  },
  
  // Get a specific project by ID
  getProject: async (projectId: string): Promise<{ success: boolean; data: Project; error?: string }> => {
    try {
      const response = await apiClient.get(`/projects/${projectId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Get project ${projectId} error:`, error);
      return {
        success: false,
        data: {} as Project,
        error: error.friendlyMessage || error.message || `Failed to get project ${projectId}`
      };
    }
  },
  
  // Create a new project
  createProject: async (projectData: ProjectData): Promise<{ success: boolean; data: Project; error?: string }> => {
    try {
      const response = await apiClient.post('/projects', projectData);
      return response.data;
    } catch (error: any) {
      console.error('Create project error:', error);
      return {
        success: false,
        data: {} as Project,
        error: error.friendlyMessage || error.message || 'Failed to create project'
      };
    }
  },
  
  // Update an existing project
  updateProject: async (projectId: string, projectData: Partial<ProjectData>): Promise<{ success: boolean; data: Project; error?: string }> => {
    try {
      const response = await apiClient.put(`/projects/${projectId}`, projectData);
      return response.data;
    } catch (error: any) {
      console.error(`Update project ${projectId} error:`, error);
      return {
        success: false,
        data: {} as Project,
        error: error.friendlyMessage || error.message || `Failed to update project ${projectId}`
      };
    }
  },
  
  // Delete a project
  deleteProject: async (projectId: string): Promise<{ success: boolean; data: {}; error?: string }> => {
    try {
      const response = await apiClient.delete(`/projects/${projectId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Delete project ${projectId} error:`, error);
      return {
        success: false,
        data: {},
        error: error.friendlyMessage || error.message || `Failed to delete project ${projectId}`
      };
    }
  },
  
  // Get project statistics
  getProjectStats: async (projectId: string): Promise<{ success: boolean; data: any; error?: string }> => {
    try {
      const response = await apiClient.get(`/projects/${projectId}/stats`);
      return response.data;
    } catch (error: any) {
      console.error(`Get project stats error:`, error);
      return {
        success: false,
        data: {},
        error: error.friendlyMessage || error.message || 'Failed to get project statistics'
      };
    }
  }
};