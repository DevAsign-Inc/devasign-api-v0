import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

const CreateProjectForm: React.FC = () => {
  const { createProject, loading, error } = useApp();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Basic validation
    if (!name.trim()) {
      setFormError('Project name is required');
      return;
    }
    
    if (!repositoryUrl.trim()) {
      setFormError('Repository URL is required');
      return;
    }
    
    // Validate repository URL format
    const urlPattern = /^https?:\/\/(github\.com|gitlab\.com)\/[\w-]+\/[\w-]+\/?$/;
    if (!urlPattern.test(repositoryUrl)) {
      setFormError('Please enter a valid GitHub or GitLab repository URL');
      return;
    }
    
    try {
      const projectId = await createProject(name, repositoryUrl);
      
      if (projectId) {
        // Show success feedback
        // You could use a toast notification here
        console.log('Project created successfully');
        
        // Navigate to the new project page
        router.push(`/projects/${projectId}`);
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setFormError('Failed to create project. Please try again.');
    }
  };
  
  return (
    <Card className="border-border/40">
      <CardHeader>
        <CardTitle>Create New Project</CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit}>
          {(formError || error) && (
            <div className="mb-4 p-3 bg-destructive/20 border border-destructive/40 rounded-md text-sm flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 text-destructive" />
              <span>{formError || error}</span>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Project Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Project"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="repositoryUrl" className="block text-sm font-medium mb-1">
              Repository URL
            </label>
            <Input
              id="repositoryUrl"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Enter a valid GitHub or GitLab repository URL
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief project description"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateProjectForm;