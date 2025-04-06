import { Link, useLocation } from "wouter";
import { Home, List, TrendingUp, Cpu, Settings, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", href: "/home" },
    { icon: List, label: "Watchlist", href: "/watchlist" },
    { icon: TrendingUp, label: "Predictions", href: "/predictions" },
    { icon: Cpu, label: "AI Insights", href: "/ai-insights" },
    { icon: Settings, label: "Settings", href: "/settings" }
  ];

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-10">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex flex-col items-center py-2 flex-1", 
                  isActive ? "text-primary" : "text-neutral-500"
                )}>
                  <item.icon className="h-6 w-6" />
                  <span className="text-xs mt-1">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* AI Chat Button */}
      <button className="fixed right-4 bottom-20 bg-primary text-white rounded-full p-4 shadow-lg flex items-center justify-center z-10 hover:bg-blue-600 transition-colors">
        <MessageCircle className="h-6 w-6" />
      </button>
    </>
  );
};

export default Navigation;
