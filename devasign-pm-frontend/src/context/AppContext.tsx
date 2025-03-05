import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as freighter from '@stellar/freighter-api';
import { CONTRACT_ID, NETWORK, NETWORK_PASSPHRASE } from '../utils/soroban';
import { ContractService, Project as ContractProject, Task as ContractTask } from '../utils/contractService';

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

// Transform contract types to frontend types
function mapContractProjectToProject(project: ContractProject): Project {
  return {
    id: project.id,
    name: project.name,
    managerAddress: project.manager,
    repositoryUrl: project.repository_url,
    totalTasks: project.total_tasks
  };
}

function mapContractTaskToTask(task: ContractTask): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    compensation: parseInt(task.compensation, 10),
    projectId: task.project_id,
    status: task.status,
    applicants: task.applicants,
    assignedDeveloper: task.assigned_developer || undefined,
    completionDate: task.completion_date || undefined
  };
}

interface AppContextType {
  isWalletConnected: boolean;
  userAddress: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
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
  connectWallet: async () => {},
  disconnectWallet: () => {},
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
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [userTasks, setUserTasks] = useState<Record<string, Task[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check wallet connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        // Check if Freighter extension is installed
        if (typeof freighter === 'undefined') {
          console.log('Freighter extension not detected');
          return;
        }

        // Check if user is connected
        const isConnected = await freighter.isConnected();
        
        if (isConnected) {
          try {
            // Verify the network is correct
            const networkDetails = await freighter.getNetworkDetails();
            
            if (networkDetails.networkPassphrase !== NETWORK_PASSPHRASE) {
              console.warn(`Connected to wrong network in Freighter. Expected: ${NETWORK}, Got: ${networkDetails.network}`);
              return;
            }
            
            // Get the user's public key
            // Use a try-catch to handle potential API differences
            let address: string;
            try {
              const result = await freighter.getAddress();
              address = result.address;
            } catch (e) {
              console.log("Error with getAddress API, trying fallback:", e);
              try {
                // Try legacy API with type assertion for TypeScript
                address = await (freighter as any).getPublicKey();
              } catch (keyError) {
                console.error("Failed to get wallet address with any method:", keyError);
                throw keyError;
              }
            }
            setUserAddress(address);
            setIsWalletConnected(true);
          } catch (networkErr) {
            // Handle error but don't display to user on initial load
            console.error('Error checking wallet details:', networkErr);
          }
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
        // Don't set error on initial load - it's not a user-initiated action
      }
    };
    
    checkConnection();
  }, []);

  // Connect wallet function
  const connectWallet = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if Freighter extension is installed
      if (typeof freighter === 'undefined') {
        throw new Error('Freighter wallet is not available. Please install the Freighter extension.');
      }
      
      // Always prompt user to connect (this will open Freighter popup)
      // This ensures proper authentication even if wallet is detected as connected
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
      // Use a try-catch to handle potential API differences
      let address: string;
      try {
        const result = await freighter.getAddress();
        address = result.address;
      } catch (e) {
        console.log("Error with getAddress API, trying fallback:", e);
        try {
          // Try legacy API with type assertion for TypeScript
          address = await (freighter as any).getPublicKey();
        } catch (keyError) {
          console.error("Failed to get wallet address with any method:", keyError);
          throw new Error("Could not retrieve wallet address - please check Freighter connection");
        }
      }
      setUserAddress(address);
      setIsWalletConnected(true);
      
      // After connecting, load user's projects
      await loadUserProjects();
    } catch (err) {
      console.error('Error connecting wallet:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to connect to wallet. Please make sure Freighter is installed and unlocked.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setUserAddress(null);
    setIsWalletConnected(false);
    setUserProjects([]);
    setUserTasks({});
  };

  // Temporary workaround for loading user projects
  const loadUserProjects = async () => {
    if (!userAddress || !CONTRACT_ID) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Since our contract doesn't have a direct way to get projects by manager,
      // we're just loading dummy data for demonstration
      // In a real app, you'd have a backend service indexing projects by manager
      
      // For now, let's create a demo project if none exists
      if (userProjects.length === 0) {
        try {
          const projectId = await ContractService.createProject(
            userAddress,
            "Demo Project",
            "https://github.com/example/demo-project"
          );
          
          if (projectId) {
            const projectData = await ContractService.getProject(projectId);
            if (projectData) {
              setUserProjects([mapContractProjectToProject(projectData)]);
            }
          }
        } catch (err) {
          console.error('Error creating demo project:', err);
          // If creation fails, it might already exist
          // This is just for demo purposes
        }
      }
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load project tasks
  const loadProjectTasks = async (projectId: string) => {
    if (!CONTRACT_ID) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const tasks = await ContractService.getProjectTasks(projectId);
      
      if (tasks && tasks.length > 0) {
        const mappedTasks = tasks.map(mapContractTaskToTask);
        setUserTasks(prev => ({
          ...prev,
          [projectId]: mappedTasks
        }));
      } else {
        // No tasks found, set empty array
        setUserTasks(prev => ({
          ...prev,
          [projectId]: []
        }));
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create a new project
  const createProject = async (name: string, repositoryUrl: string): Promise<string | null> => {
    if (!userAddress || !CONTRACT_ID) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const projectId = await ContractService.createProject(
        userAddress,
        name,
        repositoryUrl
      );
      
      if (projectId) {
        // Fetch the created project details
        const projectData = await ContractService.getProject(projectId);
        if (projectData) {
          // Add to user projects
          const newProject = mapContractProjectToProject(projectData);
          setUserProjects(prev => [...prev, newProject]);
          return projectId;
        }
      }
      
      return null;
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project. Please try again.');
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
    if (!userAddress || !CONTRACT_ID) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      // Create task on the contract
      const taskId = await ContractService.createTask(
        projectId,
        title,
        description,
        compensation,
        userAddress
      );
      
      if (taskId) {
        // Fetch the created task details
        const taskData = await ContractService.getTask(taskId);
        if (taskData) {
          // Add to project tasks
          const newTask = mapContractTaskToTask(taskData);
          setUserTasks(prev => ({
            ...prev,
            [projectId]: [...(prev[projectId] || []), newTask]
          }));
          
          // Update project total tasks
          setUserProjects(prev => 
            prev.map(p => 
              p.id === projectId 
                ? { ...p, totalTasks: p.totalTasks + 1 } 
                : p
            )
          );
          
          return taskId;
        }
      }
      
      return null;
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Apply for a task (developer)
  const applyForTask = async (taskId: string, expectedCompletion: number): Promise<boolean> => {
    if (!userAddress || !CONTRACT_ID) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call contract to apply for task
      await ContractService.applyForTask(
        taskId,
        userAddress,
        expectedCompletion
      );
      
      // Find the project and task to update locally
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
          
          return true;
        }
      }
      
      return false;
    } catch (err) {
      console.error('Error applying for task:', err);
      setError('Failed to apply for task. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Start task (developer)
  const startTask = async (taskId: string): Promise<boolean> => {
    if (!userAddress || !CONTRACT_ID) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call contract to start task
      await ContractService.startTask(
        taskId,
        userAddress
      );
      
      // Find the project and task to update locally
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
          
          return true;
        }
      }
      
      return false;
    } catch (err) {
      console.error('Error starting task:', err);
      setError('Failed to start task. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mark task as completed (developer)
  const markTaskCompleted = async (taskId: string): Promise<boolean> => {
    if (!userAddress || !CONTRACT_ID) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call contract to mark task as completed
      await ContractService.markTaskCompleted(
        taskId,
        userAddress
      );
      
      // Find the project and task to update locally
      for (const [projectId, tasks] of Object.entries(userTasks)) {
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex >= 0) {
          // Task found, update it
          const updatedTasks = [...tasks];
          updatedTasks[taskIndex] = {
            ...updatedTasks[taskIndex],
            status: 'Completed',
            completionDate: Math.floor(Date.now() / 1000) // Current timestamp in seconds
          };
          
          setUserTasks(prev => ({
            ...prev,
            [projectId]: updatedTasks
          }));
          
          return true;
        }
      }
      
      return false;
    } catch (err) {
      console.error('Error marking task as completed:', err);
      setError('Failed to mark task as completed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Approve a developer application (project manager)
  const approveApplication = async (taskId: string, developerAddress: string): Promise<boolean> => {
    if (!userAddress || !CONTRACT_ID) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call contract to approve application
      await ContractService.approveApplication(
        taskId,
        developerAddress,
        userAddress
      );
      
      // Find the project and task to update locally
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
          
          return true;
        }
      }
      
      return false;
    } catch (err) {
      console.error('Error approving application:', err);
      setError('Failed to approve application. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Approve task completion (project manager)
  const approveCompletion = async (taskId: string): Promise<boolean> => {
    if (!userAddress || !CONTRACT_ID) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call contract to approve task completion
      await ContractService.approveCompletion(
        taskId,
        userAddress
      );
      
      // Find the project and task to update locally
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
          
          return true;
        }
      }
      
      return false;
    } catch (err) {
      console.error('Error approving completion:', err);
      setError('Failed to approve task completion. Please try again.');
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