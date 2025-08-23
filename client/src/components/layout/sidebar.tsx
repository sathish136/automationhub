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
      "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col fixed left-0 top-0 h-screen z-50 transition-all duration-300 shadow-2xl border-r border-slate-700",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className={cn(
        "border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center justify-between shadow-lg",
        isCollapsed ? "p-3" : "p-5"
      )}>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
            <Monitor className="h-5 w-5 text-white" />
          </div>
          {!isCollapsed && (
            <h1 className="text-lg font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent" data-testid="app-title">
              AutomationHub
            </h1>
          )}
        </div>
        
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-700 hover:shadow-md transition-all duration-200 border border-slate-600 hover:border-slate-500"
          data-testid="sidebar-toggle"
        >
          {isCollapsed ? (
            <Menu size={16} className="text-slate-300" />
          ) : (
            <ChevronLeft size={16} className="text-slate-300" />
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
                      "flex items-center rounded-xl transition-all duration-200 cursor-pointer relative group border",
                      isActive 
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg border-blue-500 transform scale-105" 
                        : "hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-600 border-slate-600 hover:border-slate-500 hover:shadow-md hover:transform hover:scale-102",
                      isCollapsed ? "px-3 py-3 justify-center" : "px-4 py-3 space-x-3"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon size={18} className={isActive ? "text-white" : "text-slate-300"} />
                    {!isCollapsed && (
                      <span className={cn(
                        "text-sm font-medium transition-colors",
                        isActive ? "text-white" : "text-slate-200 group-hover:text-white"
                      )}>{item.name}</span>
                    )}
                    
                    {/* Enhanced tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-3 py-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-50 shadow-xl border border-slate-600">
                        {item.name}
                        <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 border-l border-t border-slate-600"></div>
                      </div>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Enhanced user info and logout section */}
      <div className="p-4 border-t border-slate-700 bg-gradient-to-r from-slate-800 to-slate-900">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between w-full p-3 rounded-xl bg-gradient-to-r from-slate-700 to-slate-600 border border-slate-600 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <User size={16} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-white" data-testid="user-name">
                    {user?.fullName || user?.firstName || user?.email || 'User'}
                  </p>
                  <p className="text-xs text-slate-300 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 border border-red-400"
                data-testid="logout-button"
                title="Logout"
              >
                <LogOut size={14} className="text-white" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={logout}
            className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-200 group relative mx-auto shadow-md hover:shadow-lg border border-red-400"
            data-testid="logout-button-collapsed"
            title="Logout"
          >
            <LogOut size={16} className="mx-auto text-white" />
            {/* Enhanced tooltip for collapsed state */}
            <div className="absolute left-full ml-3 px-3 py-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-50 shadow-xl border border-slate-600">
              Logout
              <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 border-l border-t border-slate-600"></div>
            </div>
          </button>
        )}
      </div>
    </aside>
  );
}
