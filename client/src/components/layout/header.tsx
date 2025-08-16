import { Search, Bell, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/alerts/unread-count"],
    refetchInterval: 30000, // Check every 30 seconds
  });

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900" data-testid="page-title">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-gray-600 mt-1" data-testid="page-subtitle">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search sites, equipment..."
              className="pl-10 w-64"
              data-testid="search-input"
            />
          </div>
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            data-testid="notifications-button"
          >
            <Bell className="h-5 w-5" />
            {unreadCount && unreadCount.count > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                data-testid="notification-count"
              >
                {unreadCount.count}
              </Badge>
            )}
          </Button>
          
          {/* Settings */}
          <Button variant="ghost" size="icon" data-testid="settings-button" className="group">
            <Settings className="h-5 w-5 transition-transform duration-300 group-hover:rotate-180" />
          </Button>
        </div>
      </div>
    </header>
  );
}
