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
  { name: "PLC Calculations", href: "/plc-calculations", icon: Calculator },
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
        isCollapsed ? "p-3" : "p-6"
      )}>
        <div className="flex items-center space-x-3">
          <Monitor className="text-2xl text-primary" />
          {!isCollapsed && (
            <h1 className="text-lg font-bold" data-testid="app-title">
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
            <Menu size={16} />
          ) : (
            <ChevronLeft size={16} />
          )}
        </button>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <span
                    className={cn(
                      "flex items-center rounded-lg transition-colors cursor-pointer relative group",
                      isActive ? "bg-primary text-white" : "hover:bg-gray-700",
                      isCollapsed ? "px-2 py-3 justify-center" : "px-4 py-3 space-x-3"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon size={16} />
                    {!isCollapsed && (
                      <span className="text-sm">{item.name}</span>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
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
      <div className="p-4 border-t border-gray-700">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User size={16} />
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
              className="w-6 h-6 bg-red-600 hover:bg-red-700 rounded flex items-center justify-center ml-auto"
              data-testid="logout-button"
              title="Logout"
            >
              <LogOut size={10} className="text-white" />
            </button>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-8 h-8 hover:bg-gray-700 rounded transition-colors group relative mx-auto"
            data-testid="logout-button-collapsed"
            title="Logout"
          >
            <LogOut size={12} className="mx-auto text-red-400" />
            {/* Tooltip for collapsed state */}
            <div className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              Logout
            </div>
          </button>
        )}
      </div>
    </aside>
  );
}
