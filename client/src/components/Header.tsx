import { cn } from "@/lib/utils";

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
          {/* Empty div to maintain spacing */}
        </div>
      </div>
    </>
  );
};

export default Header;