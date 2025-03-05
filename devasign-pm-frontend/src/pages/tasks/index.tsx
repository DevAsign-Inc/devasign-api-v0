import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import TaskCard from '@/components/task/TaskCard';
import { useApp } from '@/context/AppContext';
import { Task } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, FilterX, Loader2 } from 'lucide-react';

const TasksPage: React.FC = () => {
  const { 
    isWalletConnected, 
    userProjects, 
    userTasks, 
    loadUserProjects, 
    loadProjectTasks, 
    loading, 
    error 
  } = useApp();
  
  const router = useRouter();
  const { filter } = router.query;
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Check if user is connected
  useEffect(() => {
    if (!isWalletConnected) {
      router.push('/');
    }
  }, [isWalletConnected, router]);
  
  // Load user projects when page loads
  useEffect(() => {
    if (isWalletConnected) {
      loadUserProjects();
    }
  }, [isWalletConnected, loadUserProjects]);
  
  // Load tasks for all projects
  useEffect(() => {
    if (isWalletConnected && userProjects.length > 0) {
      userProjects.forEach(project => {
        loadProjectTasks(project.id);
      });
    }
  }, [isWalletConnected, userProjects, loadProjectTasks]);
  
  // Set filter from URL parameter
  useEffect(() => {
    if (filter === 'attention') {
      setStatusFilter('completed');
    }
  }, [filter]);
  
  // Get all tasks across projects
  const allTasks: Task[] = Object.values(userTasks).flat();
  
  // Filter tasks by status if needed
  const filteredTasks = statusFilter === 'all'
    ? allTasks
    : allTasks.filter(task => task.status.toLowerCase() === statusFilter.toLowerCase());
  
  // Sort tasks by status (completed first, then open)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === 'Completed' && b.status !== 'Completed') return -1;
    if (a.status !== 'Completed' && b.status === 'Completed') return 1;
    return 0;
  });
  
  // Handle status filter change
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };
  
  // Clear the filter
  const clearFilter = () => {
    setStatusFilter('all');
  };
  
  if (!isWalletConnected) {
    return null; // Wait for redirect to happen
  }
  
  return (
    <Layout title="Tasks - DevAsign">
      <div className="py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">All Tasks</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="inprogress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="approved">Approved</option>
            </select>
            
            {statusFilter !== 'all' && (
              <Button 
                variant="outline" 
                size="icon"
                onClick={clearFilter}
                className="h-9 w-9"
              >
                <FilterX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-destructive/20 border border-destructive/40 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
            <span>{error}</span>
          </div>
        )}
        
        {loading && userProjects.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Loading tasks...</p>
          </div>
        ) : sortedTasks.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedTasks.map((task) => {
              // Find the project this task belongs to
              const project = userProjects.find(p => p.id === task.projectId);
              
              return (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  projectName={project?.name}
                />
              );
            })}
          </div>
        ) : (
          <Card className="bg-card/50 border-border/40">
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Tasks Found</h3>
              {statusFilter !== 'all' ? (
                <div>
                  <p className="text-muted-foreground mb-4">
                    No tasks match the selected filter.
                  </p>
                  <Button variant="outline" onClick={clearFilter}>
                    Clear Filter
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  You dont have any tasks yet. Create a project and add tasks to get started.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default TasksPage;