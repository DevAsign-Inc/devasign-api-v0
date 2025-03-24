import React from 'react';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import { useApp } from '@/context/AppContext';
import { useRedirectAuthenticated } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, DollarSign, GitFork, UserCheck } from 'lucide-react';

const HomePage: React.FC = () => {
  const { isWalletConnected, connectWallet, loading, error } = useApp();
  
  // Redirect if already logged in
  useRedirectAuthenticated();
  
  const handleConnectWallet = async () => {
    try {
      await connectWallet();
    } catch (err) {
      console.error('Connection error:', err);
    }
  };
  
  return (
    <Layout>
      <div className="py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            <span className="logo-text">Decentralized</span>{' '}
            Task Management
          </h1>
          
          <p className="mt-4 text-xl text-muted-foreground">
            DevAsign simplifies how open-source projects coordinate work, incentivize contributions, 
            and ensure transparent, fair compensation for developers.
          </p>
          
          {error && (
            <div className="mt-6 p-4 bg-destructive/20 border border-destructive/40 rounded-md">
              <p className="text-destructive">{error}</p>
            </div>
          )}
          
          <div className="mt-10">
            {isWalletConnected ? (
              <Link href="/dashboard">
                <Button size="lg" className="group">
                  <span>Go to Dashboard</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <Button
                onClick={handleConnectWallet}
                disabled={loading}
                size="lg"
              >
                {loading ? 'Connecting...' : 'Connect Wallet to Start'}
              </Button>
            )}
          </div>
        </div>
        
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-center mb-12">
            Key Features
          </h2>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            <Card className="bg-card/50 backdrop-blur-sm dashboard-card">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <GitFork className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Transparent Task Allocation
                </h3>
                <p className="text-muted-foreground">
                  Seamlessly convert GitHub/GitLab issues into trackable, blockchain-verified tasks.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm dashboard-card">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Trustless Compensation
                </h3>
                <p className="text-muted-foreground">
                  Automate developer payments based on verifiable task completion with secure escrow.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm dashboard-card">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <UserCheck className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Decentralized Accountability
                </h3>
                <p className="text-muted-foreground">
                  Eliminate intermediaries and create a trust-minimized contribution framework.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mt-24 max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6">
            How It Works
          </h2>
          
          <Card className="bg-card/50 backdrop-blur-sm dashboard-card">
            <CardContent className="p-6">
              <div className="space-y-8">
                <div className="flex items-start sm:items-center flex-col sm:flex-row text-left">
                  <div className="flex-shrink-0 mb-4 sm:mb-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary text-primary-foreground font-bold">
                      1
                    </div>
                  </div>
                  <div className="sm:ml-4">
                    <h3 className="text-lg font-medium">
                      Create a Project
                    </h3>
                    <p className="mt-1 text-muted-foreground">
                      Connect your GitHub/GitLab repository and set up your project on DevAsign.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start sm:items-center flex-col sm:flex-row text-left">
                  <div className="flex-shrink-0 mb-4 sm:mb-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary text-primary-foreground font-bold">
                      2
                    </div>
                  </div>
                  <div className="sm:ml-4">
                    <h3 className="text-lg font-medium">
                      Create Tasks with Compensation
                    </h3>
                    <p className="mt-1 text-muted-foreground">
                      Define tasks with clear requirements and allocate funds for each task. Funds are securely held in escrow.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start sm:items-center flex-col sm:flex-row text-left">
                  <div className="flex-shrink-0 mb-4 sm:mb-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary text-primary-foreground font-bold">
                      3
                    </div>
                  </div>
                  <div className="sm:ml-4">
                    <h3 className="text-lg font-medium">
                      Approve Developers
                    </h3>
                    <p className="mt-1 text-muted-foreground">
                      Review applications and select qualified developers for your tasks.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start sm:items-center flex-col sm:flex-row text-left">
                  <div className="flex-shrink-0 mb-4 sm:mb-0">
                    <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary text-primary-foreground font-bold">
                      4
                    </div>
                  </div>
                  <div className="sm:ml-4">
                    <h3 className="text-lg font-medium">
                      Verify Completion & Release Funds
                    </h3>
                    <p className="mt-1 text-muted-foreground">
                      When tasks are completed, verify the work and approve payment. Funds are automatically transferred to the developer.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;