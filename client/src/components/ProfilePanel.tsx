import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { 
  Settings, Bell, User, Lock, Shield, Settings2, LogOut,
  BarChart2, Newspaper, Lightbulb, ListChecks, MessageSquare, Palette, X 
} from 'lucide-react';
import { Link } from 'wouter';

export function ProfilePanel() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current && 
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
      >
        <User className="h-5 w-5" />
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="profile-panel visible"
        >
          <div className="profile-header">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3>{user?.fullName || 'Guest User'}</h3>
                <p>{user?.email || 'Not signed in'}</p>
              </div>
            </div>
          </div>

          <nav className="profile-nav">
            <Link href="/settings">
              <a className="profile-nav-link">
                <Settings2 size={18} />
                Settings
              </a>
            </Link>
            <Link href="/watchlist">
              <a className="profile-nav-link">
                <ListChecks size={18} />
                Watchlist
              </a>
            </Link>
            <Link href="/ai-insights">
              <a className="profile-nav-link">
                <Lightbulb size={18} />
                AI Insights
              </a>
            </Link>
          </nav>

          <div className="profile-actions">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}