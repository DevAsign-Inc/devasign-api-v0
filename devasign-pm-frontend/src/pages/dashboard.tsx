import React, { useEffect } from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import ProjectCard from '@/components/project/ProjectCard';
import { useApp } from '@/context/AppContext';
import { useAuthProtection } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2, Plus, Layers, Code2, BellRing } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { userProjects, userTasks, loadUserProjects, loading, error } = useApp();
  
  // Protect this route - redirect to home if not authenticated
  const { isWalletConnected } = useAuthProtection('/');
  
  // Load user projects when page loads
  useEffect(() => {
    if (isWalletConnected) {
      loadUserProjects();
    }
  }, [isWalletConnected, loadUserProjects]);
  
  // Calculate total tasks across all projects
  const totalTasks = Object.values(userTasks).reduce(
    (total, tasks) => total + tasks.length, 
    0
  );
  
  // Calculate tasks that need attention (e.g., completed tasks waiting for approval)
  const tasksNeedingAttention = Object.values(userTasks).reduce(
    (total, tasks) => total + tasks.filter(task => task.status === 'Completed').length, 
    0
  );
  
  if (!isWalletConnected) {
    return null; // Wait for redirect to happen
  }
  
  return (
    <Layout title="Dashboard - DevAsign">
      <div className="py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Link href="/projects/new">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Button>
          </Link>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-destructive/20 border border-destructive/40 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Layers className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-medium">Projects</h2>
                  <p className="text-3xl font-bold mt-1">{userProjects.length}</p>
                  <Link href="/projects" className="text-primary text-sm hover:underline mt-1 inline-block">
                    View All Projects →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Code2 className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-medium">Total Tasks</h2>
                  <p className="text-3xl font-bold mt-1">{totalTasks}</p>
                  <Link href="/tasks" className="text-primary text-sm hover:underline mt-1 inline-block">
                    View All Tasks →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="dashboard-card">
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BellRing className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-medium">Needs Attention</h2>
                  <p className="text-3xl font-bold mt-1 text-primary">{tasksNeedingAttention}</p>
                  <Link href="/tasks?filter=attention" className="text-primary text-sm hover:underline mt-1 inline-block">
                    View Tasks →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Projects</h2>
            <Link href="/projects">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-muted-foreground">Loading projects...</p>
            </div>
          ) : userProjects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {userProjects.slice(0, 3).map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <Card className="bg-card/50 border-border/40">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground mb-4">You don&apos;t have any projects yet.</p>
                <Link href="/projects/new">
                  <Button>
                    Create Your First Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
          </div>
          
          <Card className="bg-card/50 border-border/40">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                Activity feed will appear here as you use the platform.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;