import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Sites from "@/pages/sites";
import SiteEvents from "@/pages/site-events";
import SiteDatabase from "@/pages/site-database";
import PlcTagManagement from "@/pages/plc-tag-management";
import Backups from "@/pages/backups";
import VFD from "@/pages/vfd";
import Reports from "@/pages/reports";
import ProjectDetails from "@/pages/project-details";
import Settings from "@/pages/settings";
import IPCDetails from "@/pages/ipc-details";
import SqlViewerPage from "@/pages/sql-viewer";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto ml-64">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/sites" component={Sites} />
          <Route path="/site-events" component={SiteEvents} />
          <Route path="/site-database" component={SiteDatabase} />
          <Route path="/plc-tag-management" component={PlcTagManagement} />
          <Route path="/backups" component={Backups} />
          <Route path="/vfd" component={VFD} />
          <Route path="/reports" component={Reports} />
          <Route path="/project-details" component={ProjectDetails} />
          <Route path="/settings" component={Settings} />
          <Route path="/ipc-management" component={IPCDetails} />
          <Route path="/sql-viewer" component={SqlViewerPage} />
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
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
