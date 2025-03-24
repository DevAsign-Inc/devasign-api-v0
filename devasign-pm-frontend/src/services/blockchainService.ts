import { ContractService } from '../utils/contractService';
import { projectService } from './projectService';
import { taskService } from './taskService';

export const blockchainService = {
  // Create a project on both backend and blockchain
  createProject: async (userAddress, name, repositoryUrl, description = '') => {
    try {
      // Step 1: Create project in MongoDB
      const backendResponse = await projectService.createProject({
        name,
        description: description || `Project imported from ${repositoryUrl}`,
        startDate: new Date().toISOString(),
        repositoryUrl,
        status: 'planning'
      });
      
      const projectId = backendResponse.data._id;
      
      // Step 2: Register on blockchain (if possible)
      try {
        const contractResult = await ContractService.createProject(
          userAddress,
          name,
          repositoryUrl
        );
        
        // Step 3: Update backend project with blockchain info
        if (contractResult) {
          await projectService.updateProject(projectId, {
            isOnChain: true,
            contractTxHash: contractResult.txHash || 'unknown'
          });
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
  createTask: async (projectId, userAddress, title, description, compensation) => {
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
        if (contractResult) {
          await taskService.updateTask(taskId, {
            isOnChain: true,
            contractTxHash: contractResult.txHash || 'unknown'
          });
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
  
  // Additional methods for other blockchain integrations...
};