import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import TaskCard from '@/components/task/TaskCard';
import CreateTaskForm from '@/components/task/CreateTaskForm';
// import ProjectAnalytics from '@/components/analytics/ProjectAnalytics';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, ArrowLeft, BarChart3, GitFork, Layers, Loader2, Plus, X } from 'lucide-react';
import { formatAddress } from '@/lib/utils';

const ProjectDetailPage: React.FC = () => {
  const router = useRouter();
  const { id: projectId } = router.query;
  
  const { 
    isWalletConnected, 
    userProjects, 
    userTasks, 
    loadUserProjects, 
    loadProjectTasks, 
    loading, 
    error 
  } = useApp();
  
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  
  // Check if user is connected
  useEffect(() => {
    if (!isWalletConnected) {
      router.push('/');
    }
  }, [isWalletConnected, router]);
  
  // Load user projects and tasks when page loads
  useEffect(() => {
    if (isWalletConnected) {
      loadUserProjects();
      
      if (projectId && typeof projectId === 'string') {
        loadProjectTasks(projectId);
      }
    }
  }, [isWalletConnected, projectId, loadUserProjects, loadProjectTasks]);
  
  // Get current project from the list
  const project = userProjects.find(p => p.id === projectId);
  
  // Get tasks for this project
  const projectTasks = projectId && typeof projectId === 'string' ? userTasks[projectId] || [] : [];
  
  // Toggle create task form
  const toggleCreateTaskForm = () => {
    setShowCreateTaskForm(!showCreateTaskForm);
  };
  
  // Handle task creation success
  const handleTaskCreated = () => {
    setShowCreateTaskForm(false);
    if (projectId && typeof projectId === 'string') {
      loadProjectTasks(projectId);
    }
  };
  
  if (!isWalletConnected) {
    return null; // Wait for redirect to happen
  }
  
  if (!project && !loading) {
    return (
      <Layout title="Project Not Found - DevAsign">
        <div className="py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-8">The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <Link href="/projects">
            <Button variant="outline">
              Go back to Projects
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title={`${project?.name || 'Project'} - DevAsign`}>
      <div className="py-6">
        <div className="mb-6">
          <Link href="/projects" className="inline-flex items-center text-primary hover:text-primary/90 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back to Projects</span>
          </Link>
        </div>
        
        {loading && !project ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Loading project...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h1 className="text-2xl font-bold">{project?.name}</h1>
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <GitFork className="h-4 w-4 mr-2" />
                  <a 
                    href={project?.repositoryUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors"
                  >
                    {project?.repositoryUrl}
                  </a>
                </div>
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <Layers className="h-4 w-4 mr-2" />
                  <span>Manager: {formatAddress(project?.managerAddress)}</span>
                </div>
              </div>
              
              <Button
                onClick={toggleCreateTaskForm}
                className="flex items-center space-x-2"
              >
                {showCreateTaskForm ? (
                  <>
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Create Task</span>
                  </>
                )}
              </Button>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-destructive/20 border border-destructive/40 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
                <span>{error}</span>
              </div>
            )}
            
            {showCreateTaskForm && projectId && typeof projectId === 'string' && (
              <div className="mb-8">
                <CreateTaskForm 
                  projectId={projectId} 
                  onSuccess={handleTaskCreated}
                  onCancel={toggleCreateTaskForm}
                />
              </div>
            )}
            
            <Tabs defaultValue="tasks" className="mb-8">
              <TabsList className="mb-4">
                <TabsTrigger value="tasks" className="flex items-center">
                  <Layers className="h-4 w-4 mr-2" />
                  Tasks
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="tasks">
                <h2 className="text-xl font-semibold mb-4">Tasks</h2>
                
                {loading && !projectTasks.length ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-sm text-muted-foreground">Loading tasks...</p>
                  </div>
                ) : projectTasks.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {projectTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-card/50 border-border/40">
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground mb-4">This project doesn&apos;t have any tasks yet.</p>
                      <Button
                        onClick={toggleCreateTaskForm}
                      >
                        Create Your First Task
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              {/* <TabsContent value="analytics">
                {projectId && typeof projectId === 'string' && (
                  <ProjectAnalytics projectId={projectId} />
                )}
              </TabsContent> */}
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ProjectDetailPage;