import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  centerTitle?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
  className?: string;
}

// Simplified Header with no profile, notification, or theme toggle
const Header = ({ 
  title = "", 
  centerTitle = false, 
  showBackButton = false,
  onBackClick,
  className 
}: HeaderProps) => {
  return (
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
        {/* Remove the app name 'StockVisionPro' as requested */}
        {title !== "StockVisionPro" ? title : ""}
      </h1>
      
      {/* No buttons or additional UI elements */}
      <div className="header-buttons">
        {/* Empty space to maintain layout */}
      </div>
    </div>
  );
};

export default Header;