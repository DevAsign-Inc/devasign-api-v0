import React, { ReactNode } from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import { Github, Twitter } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = 'DevAsign - Decentralized Task Management'
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Head>
        <title>{title}</title>
        <meta name="description" content="DevAsign - Decentralized Task Management and Contribution Platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Navbar />
      
      <main className="flex-grow py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      
      <footer className="border-t border-border py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-4 sm:mb-0">
              <span className="text-2xl font-bold logo-text mr-2">DevAsign</span>
              <span className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} All rights reserved
              </span>
            </div>
            <div className="flex space-x-4">
              <a href="https://github.com" className="text-foreground/70 hover:text-primary" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" className="text-foreground/70 hover:text-primary" target="_blank" rel="noopener noreferrer">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;