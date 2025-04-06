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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  // Toggle profile menu
  const handleToggleProfileMenu = useCallback(() => {
    setShowProfileMenu(prev => !prev);
  }, []);

  // Close modals if clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
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
                        <span>Account Settings</span>
                      </Link>
                      <Link to="/privacy" className="profile-menu-item">
                        <i className="fa-regular fa-shield"></i>
                        <span>Privacy Policy</span>
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
    </>
  );
};

export default Header;