import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, X } from 'lucide-react';

interface CreateTaskFormProps {
  projectId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({ 
  projectId, 
  onSuccess,
  onCancel
}) => {
  const { createTask, loading, error } = useApp();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [compensation, setCompensation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Basic validation
    if (!title.trim()) {
      setFormError('Task title is required');
      return;
    }
    
    if (!description.trim()) {
      setFormError('Task description is required');
      return;
    }
    
    if (!compensation || isNaN(parseFloat(compensation)) || parseFloat(compensation) <= 0) {
      setFormError('Please enter a valid compensation amount');
      return;
    }
    
    try {
      // Convert compensation to stroops (1 XLM = 10,000,000 stroops)
      const compensationStroops = Math.floor(parseFloat(compensation) * 10000000);
      
      const taskId = await createTask(projectId, title, description, compensationStroops);
      
      if (taskId) {
        // Clear form
        setTitle('');
        setDescription('');
        setCompensation('');
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      console.error('Error creating task:', err);
      setFormError('Failed to create task. Please try again.');
    }
  };
  
  return (
    <Card className="border-border/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Create New Task</CardTitle>
        {onCancel && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
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
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Task Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Implement Feature X"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Detailed description of the task..."
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="compensation" className="block text-sm font-medium mb-1">
              Compensation (XLM)
            </label>
            <Input
              type="number"
              id="compensation"
              value={compensation}
              onChange={(e) => setCompensation(e.target.value)}
              step="0.0000001"
              min="0"
              placeholder="10.0"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              This amount will be put in escrow until task completion
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateTaskForm;