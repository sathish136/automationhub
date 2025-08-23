import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building,
  Save,
  Key,
  Zap,
  FolderOpen,
  Monitor,
  Bell,
  Activity,
  Database,
  Gauge,
  Calculator,
  Menu,
  ChevronLeft,
  Cpu,
  Table,
  HardDrive,
  FileText,
  AlertTriangle,
  BarChart3,
  Users,
  LogOut,
  User,
  Phone,
} from "lucide-react";
import { useSidebar } from "@/contexts/sidebar-context";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Project Config", href: "/project-details", icon: FileText },
  { name: "Site Monitoring", href: "/sites", icon: Building },
  { name: "Alert Events", href: "/site-events", icon: AlertTriangle },
  { name: "ADS Monitor", href: "/site-database", icon: Cpu },
  { name: "SQL Viewer", href: "/sql-viewer", icon: Table },
  { name: "System Backups", href: "/backups", icon: HardDrive },
  { name: "IPC Management", href: "/ipc-management", icon: Monitor },
  { name: "Instrumentation", href: "/instrumentation", icon: Gauge },
  { name: "Site Calls", href: "/site-calls", icon: Phone },
  { name: "Automation Wizard", href: "/automation-wizard", icon: Zap },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "User Management", href: "/user-management", icon: Users },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();

  return (
    <aside className={cn(
      "bg-gray-900 text-white flex flex-col fixed left-0 top-0 h-screen z-50 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className={cn(
        "border-b border-gray-700 flex items-center justify-between",
        isCollapsed ? "p-2" : "p-4"
      )}>
        <div className="flex items-center space-x-2">
          <Monitor className="text-lg text-primary" />
          {!isCollapsed && (
            <h1 className="text-base font-bold" data-testid="app-title">
              AutomationHub
            </h1>
          )}
        </div>
        
        <button
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-gray-700 transition-colors"
          data-testid="sidebar-toggle"
        >
          {isCollapsed ? (
            <Menu size={14} />
          ) : (
            <ChevronLeft size={14} />
          )}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <span
                    className={cn(
                      "flex items-center transition-colors cursor-pointer relative group",
                      isActive 
                        ? "bg-blue-500 text-white rounded-full mx-2 px-4 py-3" 
                        : "hover:bg-gray-700 px-4 py-3 mx-2",
                      isCollapsed ? "justify-center" : "space-x-3"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon size={16} />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{item.name}</span>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                        {item.name}
                      </div>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info and logout section */}
      <div className="p-2 border-t border-gray-700">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3 mx-3">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-500">
              {user?.photoUrl ? (
                <img 
                  src={user.photoUrl} 
                  alt={user?.fullName || user?.firstName || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white" data-testid="user-name">
                {user?.fullName || user?.firstName || 'Admin User'}
              </p>
              <p className="text-xs text-gray-400">
                Automation Engineer
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-500">
              {user?.photoUrl ? (
                <img 
                  src={user.photoUrl} 
                  alt={user?.fullName || user?.firstName || 'User'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'A'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
