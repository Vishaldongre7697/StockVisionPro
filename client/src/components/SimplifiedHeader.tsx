import { Link } from "wouter";
import { useTheme } from "@/lib/themeContext";

interface SimplifiedHeaderProps {
  hideAppName?: boolean;
}

const SimplifiedHeader = ({ hideAppName = false }: SimplifiedHeaderProps) => {
  const { theme } = useTheme();

  return (
    <header className="bg-background py-1">
      <div className="container mx-auto px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <a className="flex items-center">
              {/* Logo only */}
              <div className="h-8 w-8">
                <img src="/images/logo.svg" alt="Logo" className="h-full w-full" />
              </div>
              {!hideAppName && (
                <span className="font-bold text-xl ml-2">
                  Stock<span className="text-primary">Vision</span>Pro
                </span>
              )}
            </a>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default SimplifiedHeader;