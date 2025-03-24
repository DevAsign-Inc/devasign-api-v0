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
          {/* Form content as in your original code */}
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateTaskForm;