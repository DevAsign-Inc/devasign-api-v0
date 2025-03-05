import { invokeContract, queryContract } from './soroban';

// Contract data types
export interface Project {
  id: string;
  name: string;
  manager: string;
  repository_url: string;
  total_tasks: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  compensation: string; // Using string for i128 values
  project_id: string;
  status: 'Open' | 'Assigned' | 'InProgress' | 'Completed' | 'Approved' | 'Rejected';
  applicants: string[];
  assigned_developer: string | null;
  completion_date: number | null;
}

// Default token for payments (in a real app, this could be configurable)
const NATIVE_TOKEN_ADDRESS = 'NATIVE';

// Contract interaction methods
export const ContractService = {
  // Project Manager Functions
  
  // Create a new project
  async createProject(managerAddress: string | any, name: string, repositoryUrl: string): Promise<string> {
    // Convert managerAddress to address object if it's a plain string
    const addressParam = typeof managerAddress === 'string' 
      ? { type: 'address', value: managerAddress }
      : managerAddress;
      
    const result = await invokeContract('create_project', [
      addressParam,
      name,
      repositoryUrl
    ]);
    
    return result; // Returns project ID
  },
  
  // Create a new task with funds in escrow
  async createTask(
    projectId: string,
    title: string,
    description: string,
    compensation: number,
    managerAddress: string | any,
    tokenAddress: string | any = NATIVE_TOKEN_ADDRESS
  ): Promise<string> {
    // Convert addresses to address objects if they're plain strings
    const managerParam = typeof managerAddress === 'string' 
      ? { type: 'address', value: managerAddress }
      : managerAddress;
      
    const tokenParam = typeof tokenAddress === 'string' 
      ? { type: 'address', value: tokenAddress }
      : tokenAddress;
    
    const result = await invokeContract('create_task', [
      { type: 'bytes', value: projectId },
      title,
      description,
      compensation,
      managerParam,
      tokenParam
    ]);
    
    return result; // Returns task ID
  },
  
  // Approve developer application
  async approveApplication(
    taskId: string,
    developerAddress: string | any,
    managerAddress: string | any
  ): Promise<void> {
    // Convert addresses to address objects if they're plain strings
    const developerParam = typeof developerAddress === 'string' 
      ? { type: 'address', value: developerAddress }
      : developerAddress;
      
    const managerParam = typeof managerAddress === 'string' 
      ? { type: 'address', value: managerAddress }
      : managerAddress;
    
    await invokeContract('approve_application', [
      { type: 'bytes', value: taskId },
      developerParam,
      managerParam
    ]);
  },
  
  // Approve completed task
  async approveCompletion(
    taskId: string,
    managerAddress: string | any,
    tokenAddress: string | any = NATIVE_TOKEN_ADDRESS
  ): Promise<void> {
    // Convert addresses to address objects if they're plain strings
    const managerParam = typeof managerAddress === 'string' 
      ? { type: 'address', value: managerAddress }
      : managerAddress;
      
    const tokenParam = typeof tokenAddress === 'string' 
      ? { type: 'address', value: tokenAddress }
      : tokenAddress;
    
    await invokeContract('approve_completion', [
      { type: 'bytes', value: taskId },
      managerParam,
      tokenParam
    ]);
  },
  
  // Developer Functions
  
  // Apply for a task
  async applyForTask(
    taskId: string,
    developerAddress: string | any,
    expectedCompletion: number
  ): Promise<void> {
    // Convert address to address object if it's a plain string
    const developerParam = typeof developerAddress === 'string' 
      ? { type: 'address', value: developerAddress }
      : developerAddress;
    
    await invokeContract('apply_for_task', [
      { type: 'bytes', value: taskId },
      developerParam,
      expectedCompletion
    ]);
  },
  
  // Start task
  async startTask(
    taskId: string,
    developerAddress: string | any
  ): Promise<void> {
    // Convert address to address object if it's a plain string
    const developerParam = typeof developerAddress === 'string' 
      ? { type: 'address', value: developerAddress }
      : developerAddress;
    
    await invokeContract('start_task', [
      { type: 'bytes', value: taskId },
      developerParam
    ]);
  },
  
  // Mark task as completed
  async markTaskCompleted(
    taskId: string,
    developerAddress: string | any
  ): Promise<void> {
    // Convert address to address object if it's a plain string
    const developerParam = typeof developerAddress === 'string' 
      ? { type: 'address', value: developerAddress }
      : developerAddress;
    
    await invokeContract('mark_task_completed', [
      { type: 'bytes', value: taskId },
      developerParam
    ]);
  },
  
  // View Functions
  
  // Get all tasks for a project
  async getProjectTasks(projectId: string): Promise<Task[]> {
    const result = await queryContract('get_project_tasks', [
      { type: 'bytes', value: projectId }
    ]);
    
    return result as Task[];
  },
  
  // Get task details
  async getTask(taskId: string): Promise<Task | null> {
    const result = await queryContract('get_task', [
      { type: 'bytes', value: taskId }
    ]);
    
    return result as Task | null;
  },
  
  // Get project details
  async getProject(projectId: string): Promise<Project | null> {
    const result = await queryContract('get_project', [
      { type: 'bytes', value: projectId }
    ]);
    
    return result as Project | null;
  },
  
  // Helper function to get all projects (not directly in contract)
  // In a real implementation, we would have a backend API to query all projects
  // or implement pagination in the smart contract
  async getManagerProjects(managerAddress: string): Promise<Project[]> {
    throw new Error('Not implemented: This would require backend indexing or contract changes');
    // For demonstration only, this should be implemented with a backend service
    // that indexes contract events or a contract method to retrieve projects by manager
  }
};