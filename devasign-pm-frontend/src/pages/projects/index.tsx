import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import ProjectCard from '@/components/project/ProjectCard';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2, Plus } from 'lucide-react';

const ProjectsPage: React.FC = () => {
  const { isWalletConnected, userProjects, loadUserProjects, loading, error } = useApp();
  const router = useRouter();
  
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
  
  if (!isWalletConnected) {
    return null; // Wait for redirect to happen
  }
  
  return (
    <Layout title="My Projects - DevAsign">
      <div className="py-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">My Projects</h1>
          <Link href="/projects/new">
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Create Project</span>
            </Button>
          </Link>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-destructive/20 border border-destructive/40 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-destructive" />
            <span>{error}</span>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-muted-foreground">Loading projects...</p>
          </div>
        ) : userProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {userProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <Card className="bg-card/50 border-border/40">
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first project to start managing tasks on the blockchain.
              </p>
              <Link href="/projects/new">
                <Button size="lg">
                  Create Your First Project
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ProjectsPage;