import React from 'react';
import Link from 'next/link';
import { Project } from '@/context/AppContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatAddress } from '@/lib/utils';
import { Layers, GitFork, ArrowRight } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <Card className="overflow-hidden task-card border-border/40 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold truncate">{project.name}</CardTitle>
          <Badge variant="outline" className="bg-secondary border-primary/20 text-primary">
            {project.totalTasks} Tasks
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow">
        <div className="space-y-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <GitFork className="h-4 w-4 mr-2 text-muted-foreground" />
            <a 
              href={project.repositoryUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="truncate hover:text-primary transition-colors"
            >
              {project.repositoryUrl}
            </a>
          </div>
          
          <div className="flex items-center text-sm text-muted-foreground">
            <Layers className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>Manager: {formatAddress(project.managerAddress)}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-3 border-t border-border/40">
        <Link href={`/projects/${project.id}`} className="w-full">
          <Button variant="outline" className="w-full flex items-center justify-center group">
            <span>View Details</span>
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;