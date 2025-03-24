import { ContractService } from '../utils/contractService';
import { projectService } from './projectService';
import { taskService } from './taskService';

// Define interfaces for the response types
interface ProjectResponse {
  success: boolean;
  data: {
    _id: string;
    name: string;
    description: string;
    owner: string;
    repositoryUrl: string;
    isOnChain: boolean;
    contractTxHash?: string;
    [key: string]: any;
  };
  error?: string;
}

interface TaskResponse {
  success: boolean;
  data: {
    _id: string;
    title: string;
    description: string;
    compensation: string;
    status: string;
    projectId: string;
    [key: string]: any;
  };
  error?: string;
}

export const blockchainService = {
  // Create a project on both backend and blockchain
  createProject: async (
    userAddress: string, 
    name: string, 
    repositoryUrl: string, 
    description: string = ''
  ): Promise<ProjectResponse['data']> => {
    try {
      // Step 1: Create project in MongoDB
      const backendResponse = await projectService.createProject({
        name,
        description: description || `Project imported from ${repositoryUrl}`,
        startDate: new Date().toISOString(),
        repositoryUrl,
        status: 'planning'
      });
      
      if (!backendResponse.success) {
        throw new Error(backendResponse.error || 'Failed to create project on backend');
      }
      
      const projectId = backendResponse.data._id;
      
      // Step 2: Register on blockchain (if possible)
      try {
        const contractResult = await ContractService.createProject(
          userAddress,
          name,
          repositoryUrl
        );
        
        // Step 3: Update backend project with blockchain info
        if (contractResult && typeof contractResult === 'object') {
          const txHash: string = 'unknown';
          
          await projectService.updateProject(projectId, {
            isOnChain: true,
            contractTxHash: txHash
          });
          
          // Update the response data with blockchain info
          backendResponse.data.isOnChain = true;
          backendResponse.data.contractTxHash = txHash;
        }
      } catch (blockchainError) {
        console.warn('Blockchain registration failed, continuing with backend-only project:', blockchainError);
        // We continue even if blockchain fails - project still exists in database
      }
      
      return backendResponse.data;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  },
  
  // Create task with on-chain escrow
  createTask: async (
    projectId: string, 
    userAddress: string, 
    title: string, 
    description: string, 
    compensation: number
  ): Promise<TaskResponse['data']> => {
    try {
      // Step 1: Create task in MongoDB
      const backendResponse = await taskService.createTask(projectId, {
        title,
        description,
        compensation: compensation.toString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
        priority: 'medium',
        status: 'todo'
      });
      
      if (!backendResponse.success) {
        throw new Error(backendResponse.error || 'Failed to create task on backend');
      }
      
      const taskId = backendResponse.data._id;
      
      // Step 2: Create on blockchain with escrow
      try {
        const contractResult = await ContractService.createTask(
          projectId,
          title,
          description,
          compensation,
          userAddress
        );
        
        // Step 3: Update backend task with blockchain info
        if (contractResult && typeof contractResult === 'object') {
          const txHash: string = 'unknown';
          
          await taskService.updateTask(taskId, {
            isOnChain: true,
            contractTxHash: txHash
          });
          
          // Update the response data with blockchain info
          backendResponse.data.isOnChain = true;
          backendResponse.data.contractTxHash = txHash;
        }
      } catch (blockchainError) {
        console.warn('Blockchain task creation failed, continuing with backend-only task:', blockchainError);
        // We continue even if blockchain fails
      }
      
      return backendResponse.data;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  },
  
  // Apply for a task
  applyForTask: async (
    taskId: string,
    userAddress: string,
    expectedCompletion: number
  ): Promise<boolean> => {
    try {
      // First check if the task exists
      const taskResponse = await taskService.getTask(taskId);
      
      if (!taskResponse.success) {
        throw new Error(taskResponse.error || 'Task not found');
      }
      
      // Apply for the task in the blockchain
      await ContractService.applyForTask(
        taskId,
        userAddress,
        expectedCompletion
      );
      
      return true;
    } catch (error) {
      console.error('Failed to apply for task on blockchain:', error);
      throw error;
    }
  },
  
  // Start task
  startTask: async (
    taskId: string, 
    userAddress: string
  ): Promise<boolean> => {
    try {
      // Start task on blockchain
      await ContractService.startTask(
        taskId,
        userAddress
      );
      
      return true;
    } catch (error) {
      console.error('Failed to start task on blockchain:', error);
      throw error;
    }
  },
  
  // Mark task as completed
  markTaskCompleted: async (
    taskId: string, 
    userAddress: string
  ): Promise<boolean> => {
    try {
      // Mark task as completed on blockchain
      await ContractService.markTaskCompleted(
        taskId,
        userAddress
      );
      
      return true;
    } catch (error) {
      console.error('Failed to mark task as completed on blockchain:', error);
      throw error;
    }
  },
  
  // Approve application
  approveApplication: async (
    taskId: string, 
    developerAddress: string, 
    managerAddress: string
  ): Promise<boolean> => {
    try {
      // Approve application on blockchain
      await ContractService.approveApplication(
        taskId,
        developerAddress,
        managerAddress
      );
      
      return true;
    } catch (error) {
      console.error('Failed to approve application on blockchain:', error);
      throw error;
    }
  },
  
  // Approve completion and release funds
  approveCompletion: async (
    taskId: string, 
    managerAddress: string
  ): Promise<boolean> => {
    try {
      // Approve completion on blockchain
      await ContractService.approveCompletion(
        taskId,
        managerAddress
      );
      
      return true;
    } catch (error) {
      console.error('Failed to approve completion on blockchain:', error);
      throw error;
    }
  }
};