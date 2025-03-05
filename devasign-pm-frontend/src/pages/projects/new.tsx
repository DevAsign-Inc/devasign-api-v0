import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import CreateProjectForm from '@/components/project/CreateProjectForm';
import { useApp } from '@/context/AppContext';
import { ArrowLeft } from 'lucide-react';

const CreateProjectPage: React.FC = () => {
  const { isWalletConnected } = useApp();
  const router = useRouter();
  
  // Check if user is connected
  useEffect(() => {
    if (!isWalletConnected) {
      router.push('/');
    }
  }, [isWalletConnected, router]);
  
  if (!isWalletConnected) {
    return null; // Wait for redirect to happen
  }
  
  return (
    <Layout title="Create New Project - DevAsign">
      <div className="py-6">
        <div className="mb-6">
          <Link href="/projects" className="inline-flex items-center text-primary hover:text-primary/90 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back to Projects</span>
          </Link>
        </div>
        
        <h1 className="text-2xl font-bold mb-8">Create New Project</h1>
        
        <div className="max-w-2xl mx-auto">
          <CreateProjectForm />
        </div>
      </div>
    </Layout>
  );
};

export default CreateProjectPage;