
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/lib/auth';
import {
    Settings, Moon, Sun, Bell, User, Lock, Shield, Settings2, LogOut,
    BarChart2, Newspaper, Lightbulb, ListChecks, MessageSquare, Palette, X
} from 'lucide-react';

// Required Sub-Component for Settings Modal
function SettingsToggleItem({ id, label, icon: Icon, isChecked, onChange }) {
    return (
        <div className="setting-item toggle-item">
            <label htmlFor={id}>
                {Icon && <Icon size={16}/>} {label}
            </label>
            <label className="switch">
                <input
                    type="checkbox"
                    id={id}
                    checked={isChecked}
                    onChange={onChange}
                />
                <span className="slider round"></span>
            </label>
        </div>
    );
}

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

export function ProfilePanel({ isOpen, onClose, triggerRef }: ProfilePanelProps) {
  const { user, logout } = useAuth();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
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
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{user?.fullName || 'Guest User'}</p>
              <p className="text-sm text-gray-500">{user?.email || 'Not signed in'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-2">
        <nav className="space-y-1">
          <Link href="/settings">
            <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Settings className="h-4 w-4 text-gray-500" />
              <span>Account Settings</span>
            </a>
          </Link>
          <Link href="/settings">
            <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Lock className="h-4 w-4 text-gray-500" />
              <span>Privacy Settings</span>
            </a>
          </Link>
          <Link href="/settings">
            <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Shield className="h-4 w-4 text-gray-500" />
              <span>Security</span>
            </a>
          </Link>
        </nav>
      </div>

      <div className="p-2 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
