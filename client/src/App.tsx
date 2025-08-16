import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Sites from "@/pages/sites";
import Backups from "@/pages/backups";
import Network from "@/pages/network";
import Communication from "@/pages/communication";
import Credentials from "@/pages/credentials";
import VFD from "@/pages/vfd";
import Reports from "@/pages/reports";
import Instruments from "@/pages/instruments";
import ProjectDetails from "@/pages/project-details";
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
          <Route path="/backups" component={Backups} />
          <Route path="/network" component={Network} />
          <Route path="/communication" component={Communication} />
          <Route path="/credentials" component={Credentials} />
          <Route path="/vfd" component={VFD} />
          <Route path="/reports" component={Reports} />
          <Route path="/instruments" component={Instruments} />
          <Route path="/project-details" component={ProjectDetails} />
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
