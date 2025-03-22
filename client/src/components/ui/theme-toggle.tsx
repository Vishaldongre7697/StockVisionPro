import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { Switch } from '@/components/ui/switch';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-4 w-4" />
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={toggleTheme}
        className="theme-toggle data-[state=checked]:bg-slate-700 data-[state=unchecked]:bg-slate-200"
      >
        <span className="theme-toggle-thumb" />
      </Switch>
      <Moon className="h-4 w-4" />
    </div>
  );
}