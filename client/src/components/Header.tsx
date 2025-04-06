import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/themeContext";

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
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [notificationCount, setNotificationCount] = useState(3); // Default notification count for demo
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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
  
  // Toggle profile menu
  const handleToggleProfileMenu = useCallback(() => {
    setShowProfileMenu(prev => !prev);
  }, []);

  // Close modals if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Handle notifications modal
      if (!target.closest('.notifications-content') && !target.closest('.icon-button-notification')) {
        setShowNotificationModal(false);
      }
      
      // Handle profile menu
      if (!target.closest('.profile-menu') && !target.closest('.profile-button')) {
        setShowProfileMenu(false);
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
            onClick={toggleTheme}
          >
            <i className={theme === 'dark' ? "fa-regular fa-sun" : "fa-regular fa-moon"}></i>
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
          
          {/* Profile Button */}
          <div className="profile-container">
            <button 
              className="profile-button" 
              onClick={handleToggleProfileMenu}
              aria-label="Open profile menu"
            >
              {user ? (
                <img 
                  src={user.profileImage || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.username || "User")} 
                  alt={user.username || "User"} 
                  className="profile-image"
                />
              ) : (
                <div className="profile-image-placeholder">
                  <i className="fa-regular fa-user"></i>
                </div>
              )}
            </button>
            
            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="profile-menu" ref={profileMenuRef}>
                <div className="profile-menu-header">
                  {user ? (
                    <>
                      <div className="profile-menu-user-info">
                        <img 
                          src={user.profileImage || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.username || "User")} 
                          alt={user.username || "User"}
                          className="profile-menu-image"  
                        />
                        <div>
                          <div className="profile-menu-name">{user.fullName || user.username}</div>
                          <div className="profile-menu-email">{user.email}</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="profile-menu-guest">
                      <div className="profile-menu-guest-icon">
                        <i className="fa-regular fa-user"></i>
                      </div>
                      <div className="profile-menu-guest-text">
                        <Link to="/login" className="profile-menu-link">Log in</Link>
                        {' or '}
                        <Link to="/register" className="profile-menu-link">Register</Link>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="profile-menu-items">
                  {user ? (
                    <>
                      <Link to="/settings" className="profile-menu-item">
                        <i className="fa-regular fa-gear"></i>
                        <span>Settings</span>
                      </Link>
                      <Link to="/portfolio" className="profile-menu-item">
                        <i className="fa-regular fa-briefcase"></i>
                        <span>Portfolio</span>
                      </Link>
                      <button 
                        className="profile-menu-item profile-menu-logout"
                        onClick={() => {
                          // Logout logic would go here
                          setShowProfileMenu(false);
                        }}
                      >
                        <i className="fa-regular fa-sign-out"></i>
                        <span>Log out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/watchlist" className="profile-menu-item">
                        <i className="fa-regular fa-star"></i>
                        <span>Watchlist</span>
                      </Link>
                      <Link to="/login" className="profile-menu-item">
                        <i className="fa-regular fa-sign-in"></i>
                        <span>Log in</span>
                      </Link>
                      <Link to="/register" className="profile-menu-item">
                        <i className="fa-regular fa-user-plus"></i>
                        <span>Register</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
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