import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import {
  User, Lock, Shield, Settings2, LogOut, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProfilePanel() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>

      <div ref={panelRef} className={`profile-panel ${isOpen ? 'visible' : ''}`}>
        <div className="profile-header">
          <img 
            src={user?.profileImage || "https://via.placeholder.com/150"} 
            alt="Profile" 
            className="profile-avatar"
          />
          <div className="profile-user-info">
            <h3>{user?.fullName || user?.username || 'Guest'}</h3>
            <p>{user?.email || 'Not signed in'}</p>
          </div>
        </div>

        <nav className="profile-nav">
          <a className="profile-nav-link">
            <User size={16}/> Edit Profile
          </a>
          <a className="profile-nav-link">
            <Lock size={16}/> Change Password
          </a>
          <a className="profile-nav-link">
            <Shield size={16}/> Privacy Policy
          </a>
          <a className="profile-nav-link">
            <Settings2 size={16}/> App Settings
          </a>
        </nav>

        <div className="profile-actions">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16}/>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}