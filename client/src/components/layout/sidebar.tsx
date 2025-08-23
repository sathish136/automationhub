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
            <h1 className="text-sm font-bold" data-testid="app-title">
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

      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <span
                    className={cn(
                      "flex items-center rounded-md transition-colors cursor-pointer relative group",
                      isActive ? "bg-primary text-white" : "hover:bg-gray-700",
                      isCollapsed ? "px-2 py-2 justify-center" : "px-3 py-2 space-x-2"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon size={14} />
                    {!isCollapsed && (
                      <span className="text-xs font-medium">{item.name}</span>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
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
          <div className="space-y-2">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <User size={12} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" data-testid="user-name">
                    {user?.fullName || user?.firstName || user?.email || 'User'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-5 h-5 bg-red-600 hover:bg-red-700 rounded flex items-center justify-center"
                data-testid="logout-button"
                title="Logout"
              >
                <LogOut size={8} className="text-white" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-6 h-6 hover:bg-gray-700 rounded transition-colors group relative mx-auto"
            data-testid="logout-button-collapsed"
            title="Logout"
          >
            <LogOut size={10} className="mx-auto text-red-400" />
            {/* Tooltip for collapsed state */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              Logout
            </div>
          </button>
        )}
      </div>
    </aside>
  );
}
