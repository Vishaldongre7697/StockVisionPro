import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { UserCircle, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/themeContext";

const ModernHeader = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme } = useTheme();

  return (
    <header className="bg-background border-b border-border py-3">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <a className="flex items-center">
              {/* Logo */}
              <div className="h-10 w-10">
                <img src="/images/logo.svg" alt="StockVisionPro Logo" className="h-full w-full" />
              </div>
            </a>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          {/* App name */}
          <span className="font-bold text-xl hidden md:inline-block">
            Stock<span className="text-primary">Vision</span>Pro
          </span>
          
          {/* Profile or Login */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center p-0 border-2 border-white shadow-md"
                  variant="ghost"
                >
                  <span className="text-sm font-medium">
                    {user?.username?.substring(0, 2).toUpperCase() || "U"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="profile-panel w-56">
                <div className="px-2 py-2.5 mb-1">
                  <p className="text-sm font-medium">{user?.fullName || user?.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <a className="flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Account Settings</span>
                    </a>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default ModernHeader;