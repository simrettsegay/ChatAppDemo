import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface ChatHeaderProps {
  title: string;
  avatarUrl?: string;
  isOnline?: boolean;
  onMenuClick?: () => void;
  className?: string;
}

export function ChatHeader({
  title,
  avatarUrl,
  isOnline = false,
  onMenuClick,
  className = "",
}: ChatHeaderProps) {
  return (
    <header
      className={`
        px-4 py-3
        border-b border-gray-200 dark:border-gray-800
        bg-white/70 dark:bg-gray-900/40 backdrop-blur-xl
        flex items-center justify-between
        shadow-sm
        ${className}
      `}
    >
      <div className="flex items-center gap-4">
        
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden rounded-full text-gray-600 hover:bg-gray-200/50 dark:text-gray-300 dark:hover:bg-gray-800/50"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Avatar + Name */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={avatarUrl || "/default-avatar.png"}
              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
              alt="avatar"
            />
            
            {/* Online Status Dot */}
            <span
              className={`
                absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900
                ${isOnline ? "bg-green-500" : "bg-gray-400"}
              `}
            />

            {/* Glow Effect */}
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 opacity-40 blur-sm animate-pulse"></span>
            )}
          </div>

          {/* User Title */}
          <div className="flex flex-col">
            <h2 className="text-base font-semibold leading-tight">{title}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
