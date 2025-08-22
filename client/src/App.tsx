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
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context";

function Router() {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className={`flex-1 overflow-auto transition-all duration-300 ${
        isCollapsed ? "ml-16" : "ml-64"
      }`}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/sites" component={Sites} />
          <Route path="/site-events" component={SiteEvents} />
          <Route path="/site-database" component={SiteDatabase} />
          <Route path="/backups" component={Backups} />
          <Route path="/project-details" component={ProjectDetails} />
          <Route path="/ipc-management" component={IPCDetails} />
          <Route path="/sql-viewer" component={SqlViewerPage} />
          <Route path="/instrumentation" component={InstrumentationPage} />
          <Route path="/plc-calculations" component={PlcCalculationsPage} />
          <Route path="/automation-wizard" component={AutomationWizardPage} />
          <Route path="/reports" component={ReportsPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <Toaster />
          <Router />
        </SidebarProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
