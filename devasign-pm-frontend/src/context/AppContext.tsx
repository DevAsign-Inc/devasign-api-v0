import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as freighter from '@stellar/freighter-api';
import { CONTRACT_ID, NETWORK, NETWORK_PASSPHRASE } from '../utils/soroban';
import { ContractService, Project as ContractProject, Task as ContractTask } from '../utils/contractService';
import { authService } from '../services/authService';
import { projectService } from '../services/projectService';
import { taskService } from '../services/taskService';
import { blockchainService } from '../services/blockchainService';

// Define types for frontend use
export interface Project {
  id: string;
  name: string;
  managerAddress: string;
  repositoryUrl: string;
  totalTasks: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  compensation: number;
  projectId: string;
  status: 'Open' | 'Assigned' | 'InProgress' | 'Completed' | 'Approved' | 'Rejected';
  applicants: string[];
  assignedDeveloper?: string;
  completionDate?: number;
}

interface AppContextType {
  isWalletConnected: boolean;
  userAddress: string | null;
  userName: string | null;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => Promise<boolean>;
  userProjects: Project[];
  userTasks: Record<string, Task[]>;
  loadUserProjects: () => Promise<void>;
  loadProjectTasks: (projectId: string) => Promise<void>;
  createProject: (name: string, repositoryUrl: string) => Promise<string | null>;
  createTask: (
    projectId: string, 
    title: string, 
    description: string, 
    compensation: number
  ) => Promise<string | null>;
  applyForTask: (taskId: string, expectedCompletion: number) => Promise<boolean>;
  startTask: (taskId: string) => Promise<boolean>;
  markTaskCompleted: (taskId: string) => Promise<boolean>;
  approveApplication: (taskId: string, developerAddress: string) => Promise<boolean>;
  approveCompletion: (taskId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

// Create the context with default values
const AppContext = createContext<AppContextType>({
  isWalletConnected: false,
  userAddress: null,
  userName: null,
  connectWallet: async () => false,
  disconnectWallet: async () => false,
  userProjects: [],
  userTasks: {},
  loadUserProjects: async () => {},
  loadProjectTasks: async () => {},
  createProject: async () => null,
  createTask: async () => null,
  applyForTask: async () => false,
  startTask: async () => false,
  markTaskCompleted: async () => false,
  approveApplication: async () => false,
  approveCompletion: async () => false,
  loading: false,
  error: null,
});

// AppProvider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [userTasks, setUserTasks] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if token exists on mount and restore session
  useEffect(() => {
    const checkAuthentication = async () => {
      if (typeof window !== 'undefined' && localStorage.getItem('auth_token')) {
        try {
          // Check if Freighter is connected
          if (typeof freighter === 'undefined' || !(await freighter.isConnected())) {
            // Token exists but wallet disconnected - clear token
            localStorage.removeItem('auth_token');
            return;
          }
          
          // Get wallet address
          let address;
          try {
            const result = await freighter.getAddress();
            address = result.address;
          } catch (e) {
            address = await (freighter as any).getPublicKey();
          }
          
          if (!address) {
            localStorage.removeItem('auth_token');
            return;
          }
          
          // Get user profile from backend
          const response = await authService.getCurrentUser();
          
          if (response.success) {
            setUserName(response.data.name);
            setUserAddress(address);
            setIsWalletConnected(true);
            
            // Load initial data
            await loadUserProjects();
          }
        } catch (error) {
          console.error('Session restoration failed:', error);
          localStorage.removeItem('auth_token');
        }
      }
    };
    
    checkAuthentication();
  }, []);

  // Connect wallet function
  const connectWallet = async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if Freighter extension is installed
      if (typeof freighter === 'undefined') {
        throw new Error('Freighter wallet is not available. Please install the Freighter extension.');
      }
      
      // Request access to the wallet
      await freighter.requestAccess();
      
      // Check if connected after user interaction
      const isConnected = await freighter.isConnected();
      if (!isConnected) {
        throw new Error('Failed to connect to Freighter. Please try again.');
      }
      
      // Verify the network
      const networkDetails = await freighter.getNetworkDetails();
      if (networkDetails.networkPassphrase !== NETWORK_PASSPHRASE) {
        throw new Error(`Please switch to ${NETWORK} in your Freighter wallet settings.`);
      }
      
      // Get the user's public key
      let address;
      try {
        const result = await freighter.getAddress();
        address = result.address;
      } catch (e) {
        console.log("Error with getAddress API, trying fallback:", e);
        try {
          address = await (freighter as any).getPublicKey();
        } catch (keyError) {
          throw new Error("Could not retrieve wallet address - please check Freighter connection");
        }
      }
      
      if (!address) {
        throw new Error('Could not get wallet address');
      }
      
      // Start the backend authentication process
      // Step 1: Initialize authentication and get nonce
      const initResult = await authService.initWalletAuth(address);
      
      if (!initResult.success) {
        console.error('Authentication initialization failed:', initResult.error);
        throw new Error(initResult.error || 'Failed to initialize authentication');
      }
      
      console.log('Authentication initialization successful');
      
      // The API returns { success: true, data: { message, nonce } }
      const { message, nonce } = initResult.data;
      
      // Step 2: Sign the message with Freighter
      const signResult = await freighter.signMessage(message);
      
      if (!signResult || !('signature' in signResult) || !signResult.signature) {
        throw new Error('Failed to sign message with wallet');
      }
      
      // Step 3: Verify the signature with backend
      const verifyResult = await authService.verifyWalletAuth(address, signResult.signature as string);
      
      if (!verifyResult.success) {
        throw new Error(verifyResult.error || 'Failed to verify signature');
      }
      
      const { token, user } = verifyResult;
      
      // Store token for API authentication if token is available
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        throw new Error('Authentication token is undefined');
      }
      
      // Update app state
      setUserAddress(address);
      setUserName(user.name || null);
      setIsWalletConnected(true);
      
      // Load initial data
      await loadUserProjects();
      
      return true;
    } catch (err) {
      console.error('Error connecting wallet:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to connect to wallet. Please try again.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = async (): Promise<boolean> => {
    try {
      // Clear auth token and reset state
      await authService.logout();
      setUserAddress(null);
      setUserName(null);
      setIsWalletConnected(false);
      setUserProjects([]);
      setUserTasks({});
      
      // Force page reload to clear Freighter state
      if (typeof window !== 'undefined') {
        // Set disconnection flag and reload
        localStorage.setItem('freighter_disconnected', 'true');
        window.location.reload();
      }
      
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  };

  // Load user projects
  const loadUserProjects = async (): Promise<void> => {
    if (!isWalletConnected) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await projectService.getProjects();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load projects');
      }
      
      // Map backend projects to our frontend format
      const projects = result.data.map(project => ({
        id: project._id,
        name: project.name,
        managerAddress: typeof project.owner === 'object' ? project.owner.stellarAddress : project.owner,
        repositoryUrl: project.repositoryUrl || '',
        totalTasks: project.tasks?.length || 0
      }));
      
      setUserProjects(projects);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Load project tasks
  const loadProjectTasks = async (projectId: string): Promise<void> => {
    if (!isWalletConnected) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await taskService.getProjectTasks(projectId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load tasks');
      }
      
      // Map backend tasks to our frontend format
      interface BackendTask {
        _id: string;
        title: string;
        description: string;
        compensation: string;
        project: string;
        status: 'Open' | 'Assigned' | 'InProgress' | 'Completed' | 'Approved' | 'Rejected';
        applicants?: string[];
        assignedTo?: { stellarAddress: string } | string;
        completionDate?: string;
      }

      interface FrontendTask {
        id: string;
        title: string;
        description: string;
        compensation: number;
        projectId: string;
        status: 'Open' | 'Assigned' | 'InProgress' | 'Completed' | 'Approved' | 'Rejected';
        applicants: string[];
        assignedDeveloper?: string;
        completionDate?: number;
      }

      const tasks: FrontendTask[] = (result.data as BackendTask[]).map(task => ({
        id: task._id,
        title: task.title,
        description: task.description,
        compensation: parseInt(task.compensation || '0', 10),
        projectId: task.project,
        status: task.status,
        applicants: task.applicants || [],
        assignedDeveloper: typeof task.assignedTo === 'object' ? task.assignedTo?.stellarAddress : task.assignedTo,
        completionDate: task.completionDate ? new Date(task.completionDate).getTime() : undefined
      }));
      
      setUserTasks(prev => ({
        ...prev,
        [projectId]: tasks
      }));
    } catch (err) {
      console.error(`Error loading tasks for project ${projectId}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Create a new project
  const createProject = async (name: string, repositoryUrl: string): Promise<string | null> => {
    if (!userAddress) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the blockchain service to create project in both systems
      const result = await blockchainService.createProject(
        userAddress,
        name,
        repositoryUrl
      );
      
      // Refresh projects list
      await loadUserProjects();
      
      return result._id;
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create a new task
  const createTask = async (
    projectId: string, 
    title: string, 
    description: string, 
    compensation: number
  ): Promise<string | null> => {
    if (!userAddress) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the blockchain service to create task in both systems
      const result = await blockchainService.createTask(
        projectId,
        userAddress,
        title,
        description,
        compensation
      );
      
      // Refresh tasks for this project
      await loadProjectTasks(projectId);
      
      return result._id;
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Apply for a task (as a developer)
  const applyForTask = async (taskId: string, expectedCompletion: number): Promise<boolean> => {
    if (!userAddress) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await taskService.updateTask(taskId, {
        action: 'apply',
        expectedCompletion: new Date(expectedCompletion).toISOString()
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to apply for task');
      }
      
      // Try to register on blockchain
      try {
        await blockchainService.applyForTask(
          taskId,
          userAddress,
          expectedCompletion
        );
      } catch (blockchainError) {
        console.warn('Blockchain application failed, continuing with backend-only:', blockchainError);
        // We continue even if blockchain fails
      }
      
      // Update tasks in state
      // Find which project this task belongs to
      for (const [projectId, tasks] of Object.entries(userTasks)) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
          // Task found, update it
          const updatedTasks = [...tasks];
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            applicants: [...updatedTasks[taskIndex].applicants, userAddress]
          };
          
          setUserTasks(prev => ({
            ...prev,
            [projectId]: updatedTasks
          }));
          break;
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error applying for task:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply for task');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Start work on a task (as an assigned developer)
  const startTask = async (taskId: string): Promise<boolean> => {
    if (!userAddress) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await taskService.updateTask(taskId, {
        action: 'start',
        status: 'InProgress'
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to start task');
      }
      
      // Try to register on blockchain
      try {
        await blockchainService.startTask(taskId, userAddress);
      } catch (blockchainError) {
        console.warn('Blockchain task start failed, continuing with backend-only:', blockchainError);
        // We continue even if blockchain fails
      }
      
      // Update tasks in state - find which project this task belongs to
      for (const [projectId, tasks] of Object.entries(userTasks)) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
          // Task found, update it
          const updatedTasks = [...tasks];
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            status: 'InProgress'
          };
          
          setUserTasks(prev => ({
            ...prev,
            [projectId]: updatedTasks
          }));
          break;
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error starting task:', err);
      setError(err instanceof Error ? err.message : 'Failed to start task');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mark task as completed (as a developer)
  const markTaskCompleted = async (taskId: string): Promise<boolean> => {
    if (!userAddress) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await taskService.updateTask(taskId, {
        action: 'complete',
        status: 'Completed',
        completionDate: new Date().toISOString()
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to mark task as completed');
      }
      
      // Try to register on blockchain
      try {
        await blockchainService.markTaskCompleted(taskId, userAddress);
      } catch (blockchainError) {
        console.warn('Blockchain task completion failed, continuing with backend-only:', blockchainError);
        // We continue even if blockchain fails
      }
      
      // Update tasks in state
      for (const [projectId, tasks] of Object.entries(userTasks)) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
          // Task found, update it
          const updatedTasks = [...tasks];
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            status: 'Completed',
            completionDate: Date.now()
          };
          
          setUserTasks(prev => ({
            ...prev,
            [projectId]: updatedTasks
          }));
          break;
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error marking task as completed:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark task as completed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Approve a developer application (as project manager)
  const approveApplication = async (taskId: string, developerAddress: string): Promise<boolean> => {
    if (!userAddress) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await taskService.updateTask(taskId, {
        action: 'approve_application',
        assignedTo: developerAddress,
        status: 'Assigned'
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to approve application');
      }
      
      // Try to register on blockchain
      try {
        await blockchainService.approveApplication(
          taskId,
          developerAddress,
          userAddress
        );
      } catch (blockchainError) {
        console.warn('Blockchain application approval failed, continuing with backend-only:', blockchainError);
        // We continue even if blockchain fails
      }
      
      // Update tasks in state
      for (const [projectId, tasks] of Object.entries(userTasks)) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
          // Task found, update it
          const updatedTasks = [...tasks];
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            status: 'Assigned',
            assignedDeveloper: developerAddress
          };
          
          setUserTasks(prev => ({
            ...prev,
            [projectId]: updatedTasks
          }));
          break;
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error approving application:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve application');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Approve task completion and release payment (as project manager)
  const approveCompletion = async (taskId: string): Promise<boolean> => {
    if (!userAddress) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await taskService.updateTask(taskId, {
        action: 'approve_completion',
        status: 'Approved'
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to approve task completion');
      }
      
      // Try to register on blockchain and release payment
      try {
        await blockchainService.approveCompletion(
          taskId,
          userAddress
        );
      } catch (blockchainError) {
        console.warn('Blockchain completion approval failed, continuing with backend-only:', blockchainError);
        // We continue even if blockchain fails
      }
      
      // Update tasks in state
      for (const [projectId, tasks] of Object.entries(userTasks)) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
          // Task found, update it
          const updatedTasks = [...tasks];
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            status: 'Approved'
          };
          
          setUserTasks(prev => ({
            ...prev,
            [projectId]: updatedTasks
          }));
          break;
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error approving completion:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve task completion');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        isWalletConnected,
        userAddress,
        userName,
        connectWallet,
        disconnectWallet,
        userProjects,
        userTasks,
        loadUserProjects,
        loadProjectTasks,
        createProject,
        createTask,
        applyForTask,
        startTask,
        markTaskCompleted,
        approveApplication,
        approveCompletion,
        loading,
        error,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useApp = () => useContext(AppContext);