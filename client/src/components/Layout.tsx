import React, { useState, useRef } from 'react';
import { BottomNavigation, FloatingSuhuButton } from './BottomNavigation';
import { ThemeToggle } from './ui/theme-toggle';
import { User, Bell, Menu, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '@/lib/auth';
import { Link } from 'wouter';
import { ProfilePanel } from './ProfilePanel';
import { useTheme } from '@/lib/themeContext';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
}

export function Layout({ children, title, showBackButton = false }: LayoutProps) {
  const { user, isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [notificationCount] = useState(2); // Example notification count
  const profileBtnRef = useRef<HTMLButtonElement>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <div className="min-h-screen pb-16 bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-40 w-full border-b transition-all duration-200",
        isSearchFocused 
          ? "bg-white dark:bg-gray-900 border-primary/20" 
          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
      )}>
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Button variant="ghost" className="mr-2" onClick={() => window.history.back()}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Button>
            )}
            {title && (
              <h1 className="font-bold text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent dark:from-primary dark:to-blue-300">
                {title}
              </h1>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <ProfilePanel />
            <ThemeToggle />
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