import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building,
  Save,
  Key,
  Sliders,
  BarChart3,
  Settings,
  FolderOpen,
  Settings2,
  Monitor,
  Bell,
  Activity,
  Database,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Project Details", href: "/project-details", icon: FolderOpen },
  { name: "Site Monitoring", href: "/sites", icon: Building },
  { name: "Site Events", href: "/site-events", icon: Bell },
  { name: "Site Database", href: "/site-database", icon: Database },
  { name: "PLC Tag Monitoring", href: "/plc-tags", icon: Activity },
  { name: "PLC Tag Management", href: "/plc-tag-management", icon: Settings2 },
  { name: "Program Backups", href: "/backups", icon: Save },
  { name: "IPC Management", href: "/ipc-management", icon: Monitor },
  { name: "VFD Parameters", href: "/vfd", icon: Sliders },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings2 },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col fixed left-0 top-0 h-screen z-50">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Settings className="text-2xl text-primary" />
          <h1 className="text-lg font-bold" data-testid="app-title">AutomationHub</h1>
        </div>
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
                      "flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer",
                      isActive 
                        ? "bg-primary text-white" 
                        : "hover:bg-gray-700"
                    )}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon size={16} />
                    <span className="text-sm">{item.name}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-sm font-medium">A</span>
          </div>
          <div>
            <p className="text-xs font-medium" data-testid="user-name">Admin User</p>
            <p className="text-xs text-gray-400">Automation Engineer</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
