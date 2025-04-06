import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

interface HeaderProps {
  title?: string;
  centerTitle?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
  className?: string;
}

// Data for notifications demo
const initialNotifications = [
  { id: 1, title: '🚀 RELIANCE breakout alert!', message: 'Stock has broken resistance at ₹2,850', time: '10 min ago' },
  { id: 2, title: '📊 Market Update', message: 'Nifty 50 hits new all-time high', time: '1 hour ago' },
  { id: 3, title: '🤖 AI Signal', message: 'Strong buy signal for TCS detected', time: '3 hours ago' }
];

const Header = ({ 
  title = "", 
  centerTitle = false, 
  showBackButton = false,
  onBackClick,
  className 
}: HeaderProps) => {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [notificationCount, setNotificationCount] = useState(3); // Default notification count for demo
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Apply theme class to body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Toggle theme
  const handleToggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // Clear notifications
  const handleClearNotifications = useCallback(() => {
    setNotifications([]);
    setNotificationCount(0);
    setShowNotificationModal(false);
  }, []);

  // Toggle notifications modal
  const handleToggleNotifications = useCallback(() => {
    setShowNotificationModal(prev => !prev);
  }, []);

  // Close modal if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.notifications-content') && !target.closest('.icon-button-notification')) {
        setShowNotificationModal(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      <div className={cn("header", className)}>
        {showBackButton && (
          <button 
            className="back-button" 
            aria-label="Go back"
            onClick={onBackClick || (() => window.history.back())}
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>
        )}
        
        <h1 className={cn("header-title", centerTitle && "center flex-grow")}>
          {title}
        </h1>
        
        <div className="header-buttons">
          <button 
            className="icon-button" 
            aria-label="Toggle Theme" 
            onClick={handleToggleTheme}
          >
            <i className={isDarkMode ? "fa-regular fa-sun" : "fa-regular fa-moon"}></i>
          </button>
          
          <div style={{ position: 'relative' }}>
            <button 
              className="icon-button icon-button-notification" 
              aria-label="Show Notifications" 
              onClick={handleToggleNotifications}
            >
              <i className="fa-regular fa-bell"></i>
            </button>
            {notificationCount > 0 && (
              <span className="badge">{notificationCount}</span>
            )}
          </div>
          
          {user ? (
            <Link href="/profile" className="profile-button">
              <div className="profile-avatar">
                {user.username ? user.username.charAt(0).toUpperCase() : "U"}
              </div>
            </Link>
          ) : (
            <Link href="/login" className="login-button">
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Notifications Modal */}
      {showNotificationModal && (
        <div className="notifications-modal">
          <div className="notifications-content">
            <div className="notifications-header">
              <h2 className="notifications-title">🔔 Notifications</h2>
              {notifications.length > 0 && (
                <button className="clear-button" onClick={handleClearNotifications}>Mark all as read</button>
              )}
              <button onClick={handleToggleNotifications} className="close-modal-button" aria-label="Close Notifications Modal">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="notifications-list">
              {notifications.length > 0 ? (
                notifications.map(item => (
                  <div className="notification-item" key={item.id}>
                    <div className="notification-title">{item.title}</div>
                    <div className="notification-message">{item.message}</div>
                    <div className="notification-time">{item.time}</div>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No new notifications.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;