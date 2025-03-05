import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { formatAddress } from '@/lib/utils';
import { Code2, Layers, LayoutDashboard, Hexagon } from 'lucide-react';

const Navbar: React.FC = () => {
  const { isWalletConnected, userAddress, connectWallet, disconnectWallet, loading } = useApp();
  const router = useRouter();
  
  const navLinks = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4 mr-1" />,
      active: router.pathname === '/dashboard',
    },
    {
      name: 'Projects',
      href: '/projects',
      icon: <Layers className="h-4 w-4 mr-1" />,
      active: router.pathname.startsWith('/projects'),
    },
    {
      name: 'Tasks',
      href: '/tasks',
      icon: <Code2 className="h-4 w-4 mr-1" />,
      active: router.pathname.startsWith('/tasks'),
    },
  ];
  
  return (
    <nav className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Hexagon className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold logo-text">DevAsign</span>
            </Link>
            
            {isWalletConnected && (
              <div className="ml-8 hidden md:flex space-x-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      link.active 
                        ? 'text-primary bg-secondary' 
                        : 'text-foreground/80 hover:text-primary hover:bg-secondary/50'
                    }`}
                  >
                    {link.icon}
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <div>
            {isWalletConnected ? (
              <div className="flex items-center space-x-4">
                <div className="bg-secondary py-1 px-3 rounded-full flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-sm text-foreground/80">
                    {formatAddress(userAddress)}
                  </span>
                </div>
                <Button
                  onClick={disconnectWallet}
                  variant="outline"
                  size="sm"
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;