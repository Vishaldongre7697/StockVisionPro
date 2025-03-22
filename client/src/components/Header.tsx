import { useAuth } from "@/lib/auth";
import { Link } from "wouter";
import { Search, Bell, UserCircle, LogOut } from "lucide-react";
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

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme } = useTheme();

  return (
    <header className="bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <a className="flex items-center">
              {/* Logo */}
              <div className="mr-2 h-8 w-8">
                <img src="/images/logo.svg" alt="StockVisionPro Logo" className="h-full w-full" />
              </div>
              <span className="font-bold text-xl">
                Stock<span className="text-primary">Vision</span>Pro
              </span>
            </a>
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" aria-label="Search">
            <Search className="h-5 w-5 text-neutral-600" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-5 w-5 text-neutral-600" />
          </Button>
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center p-0"
                  variant="ghost"
                >
                  <span className="text-sm font-medium">
                    {user?.username?.substring(0, 2).toUpperCase() || "U"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <a className="flex items-center cursor-pointer">
                      <UserCircle className="mr-2 h-4 w-4" />
                      <span>Profile</span>
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

export default Header;
