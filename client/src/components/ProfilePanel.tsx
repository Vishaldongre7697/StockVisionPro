import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import {
  User,
  Settings,
  Lock,
  Shield,
  LogOut,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

export function ProfilePanel({ isOpen, onClose, triggerRef }: ProfilePanelProps) {
  const { user, logout } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside the panel
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current && 
        !panelRef.current.contains(event.target as Node) &&
        triggerRef.current && 
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  // Handle escape key
  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="profile-panel fixed right-4 top-16 w-72 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden"
    >
      <div className="relative">
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute right-2 top-2 h-6 w-6"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800">
        <Avatar className="h-12 w-12 border-2 border-primary">
          <AvatarImage src={user?.profileImage} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {user?.fullName?.[0] || user?.username?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="font-medium leading-none">{user?.fullName || user?.username}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="p-2">
        <nav className="space-y-1">
          <Link href="/settings">
            <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span>Account Settings</span>
            </a>
          </Link>
          <Link href="/settings">
            <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Lock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span>Privacy Settings</span>
            </a>
          </Link>
          <Link href="/settings">
            <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Shield className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span>Privacy Policy</span>
            </a>
          </Link>
        </nav>
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <Button 
          variant="destructive" 
          size="sm" 
          className="w-full justify-start"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}