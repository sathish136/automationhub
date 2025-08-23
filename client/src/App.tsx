import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Sites from "@/pages/sites";
import SiteEvents from "@/pages/site-events-enhanced";
import SiteDatabase from "@/pages/site-database";
import Backups from "@/pages/backups";
import ProjectDetails from "@/pages/project-details";
import IPCDetails from "@/pages/ipc-details";
import SqlViewerPage from "@/pages/sql-viewer";
import InstrumentationPage from "@/pages/instrumentation";
import PlcCalculationsPage from "@/pages/plc-calculations";
import AutomationWizardPage from "@/pages/automation-wizard";
import ReportsPage from "@/pages/reports";
import UserManagement from "@/pages/user-management";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Sidebar from "@/components/layout/sidebar";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context";
import { AuthProvider, useAuth } from "@/contexts/auth-context";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Login />;
  }
  
  return <Component />;
}

function Router() {
  const { isCollapsed } = useSidebar();
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen flex bg-background">
      {isAuthenticated && <Sidebar />}
      <main className={`flex-1 overflow-auto transition-all duration-300 ${
        isAuthenticated ? (isCollapsed ? "ml-16" : "ml-64") : ""
      }`}>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
          <Route path="/sites" component={() => <ProtectedRoute component={Sites} />} />
          <Route path="/site-events" component={() => <ProtectedRoute component={SiteEvents} />} />
          <Route path="/site-database" component={() => <ProtectedRoute component={SiteDatabase} />} />
          <Route path="/backups" component={() => <ProtectedRoute component={Backups} />} />
          <Route path="/project-details" component={() => <ProtectedRoute component={ProjectDetails} />} />
          <Route path="/ipc-management" component={() => <ProtectedRoute component={IPCDetails} />} />
          <Route path="/sql-viewer" component={() => <ProtectedRoute component={SqlViewerPage} />} />
          <Route path="/instrumentation" component={() => <ProtectedRoute component={InstrumentationPage} />} />
          <Route path="/plc-calculations" component={() => <ProtectedRoute component={PlcCalculationsPage} />} />
          <Route path="/automation-wizard" component={() => <ProtectedRoute component={AutomationWizardPage} />} />
          <Route path="/reports" component={() => <ProtectedRoute component={ReportsPage} />} />
          <Route path="/user-management" component={() => <ProtectedRoute component={UserManagement} />} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <SidebarProvider>
      <Toaster />
      <Router />
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
