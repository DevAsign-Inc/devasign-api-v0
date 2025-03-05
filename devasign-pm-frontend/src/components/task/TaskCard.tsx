import React from 'react';
import { Task, useApp } from '@/context/AppContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatAddress, formatCompensation, statusColors } from '@/lib/utils';
import { Calendar, User, DollarSign, Users } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  projectName?: string;
  showActions?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  projectName,
  showActions = true 
}) => {
  const { approveApplication, approveCompletion, loading } = useApp();
  
  // Handle approving a developer application
  const handleApproveApplication = async (developerAddress: string) => {
    if (loading) return;
    await approveApplication(task.id, developerAddress);
  };
  
  // Handle approving task completion
  const handleApproveCompletion = async () => {
    if (loading) return;
    await approveCompletion(task.id);
  };
  
  const statusStyle = statusColors[task.status as keyof typeof statusColors];
  
  return (
    <Card className="task-card h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg font-bold">{task.title}</CardTitle>
          <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
            {task.status}
          </div>
        </div>
        
        {projectName && (
          <div className="flex items-center text-sm text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full bg-primary/70 mr-2"></span>
            <span>{projectName}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-grow pb-3">
        <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-primary/70" />
            <span>{formatCompensation(task.compensation)}</span>
          </div>
          
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-primary/70" />
            <span>{task.assignedDeveloper ? formatAddress(task.assignedDeveloper) : 'Unassigned'}</span>
          </div>
          
          {task.completionDate && (
            <div className="flex items-center col-span-2">
              <Calendar className="h-4 w-4 mr-2 text-primary/70" />
              <span>Completed: {new Date(task.completionDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      {showActions && (
        <CardFooter className="flex flex-col pt-3 border-t border-border/40">
          {task.status === 'Open' && task.applicants.length > 0 && (
            <div className="w-full">
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <Users className="h-4 w-4 mr-2 text-primary/70" />
                Applicants ({task.applicants.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {task.applicants.map((applicant) => (
                  <div key={applicant} className="flex items-center justify-between bg-secondary/50 p-2 rounded-md">
                    <span className="text-sm text-foreground/80">{formatAddress(applicant)}</span>
                    <Button
                      onClick={() => handleApproveApplication(applicant)}
                      disabled={loading}
                      size="sm"
                      className="text-xs"
                    >
                      Approve
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {task.status === 'Completed' && (
            <Button
              onClick={handleApproveCompletion}
              disabled={loading}
              className="w-full mt-2"
              variant="default"
            >
              {loading ? 'Processing...' : 'Approve Completion'}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default TaskCard;