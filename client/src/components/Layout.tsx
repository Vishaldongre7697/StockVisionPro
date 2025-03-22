import React from 'react';
import { BottomNavigation, FloatingSuhuButton } from './BottomNavigation';
import { ThemeToggle } from './ui/theme-toggle';
import { User, Bell, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/lib/auth';
import { Link } from 'wouter';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
}

export function Layout({ children, title, showBackButton = false }: LayoutProps) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            {showBackButton && (
              <Button variant="ghost" className="mr-2" onClick={() => window.history.back()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Button>
            )}
            <h1 className="font-bold text-xl">{title || 'StockVisionPro'}</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                {isAuthenticated ? (
                  <Button variant="ghost" size="icon" className="rounded-full">
                    {user?.profileImage ? (
                      <img 
                        src={user.profileImage} 
                        alt="Profile" 
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{isAuthenticated ? 'Account' : 'Menu'}</SheetTitle>
                  <SheetDescription>
                    {isAuthenticated 
                      ? `Signed in as ${user?.fullName || user?.username}`
                      : 'Access your account or browse features'}
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-4">
                  {isAuthenticated ? (
                    <>
                      <Link href="/settings">
                        <a className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                          Account Details
                        </a>
                      </Link>
                      <Link href="/settings">
                        <a className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                          Privacy Policy & Settings
                        </a>
                      </Link>
                      <hr className="border-gray-200 dark:border-gray-700" />
                      <Button 
                        variant="destructive" 
                        className="w-full" 
                        onClick={logout}
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login">
                        <a className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                          Login
                        </a>
                      </Link>
                      <Link href="/register">
                        <a className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                          Register
                        </a>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
      
      {/* Floating SuhuAI Button */}
      <FloatingSuhuButton />
    </div>
  );
}