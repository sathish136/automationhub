import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface HeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export default function Header({ title, subtitle, icon: Icon }: HeaderProps) {
  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/alerts/unread-count"],
    refetchInterval: 30000,
  });

  return (
    <header className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
              <Icon className="h-4 w-4 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100" data-testid="page-title">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-600 dark:text-slate-400" data-testid="page-subtitle">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="relative h-8 w-8 p-0"
            data-testid="notifications-button"
            asChild
          >
            <Link href="/site-events">
              <Bell className="h-4 w-4" />
              {unreadCount && unreadCount.count > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs"
                  data-testid="notification-count"
                >
                  {unreadCount.count}
                </Badge>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
