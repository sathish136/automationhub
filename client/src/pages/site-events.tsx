import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Activity, 
  Settings, 
  Database, 
  Clock, 
  Zap, 
  Cpu, 
  HardDrive, 
  Wrench, 
  Building 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface IpcConfiguration {
  id: string;
  siteName: string;
  ipAddress: string;
  port: number;
  eventsTableName: string;
  eventsDatabase: string;
}

interface CustomSiteEvent {
  id?: string;
  description?: string;
  message?: string;
  timestamp?: string;
  date_time?: string;
  site?: string;
  equipment?: string;
  type?: string;
  severity?: string;
  tag_value?: string;
  setpoint?: string;
  note?: string;
  isResolved?: boolean;
}

export default function SiteEvents() {
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedSiteConfig, setSelectedSiteConfig] = useState<string>("all");

  // Fetch available site configurations
  const { data: siteConfigs } = useQuery<IpcConfiguration[]>({
    queryKey: ["/api/ipc-management"],
  });

  // Fetch events based on selected site configuration
  const { data: customEvents, isLoading, error } = useQuery({
    queryKey: ["/api/site-events", selectedSiteConfig],
    queryFn: async () => {
      if (selectedSiteConfig === "all" || !selectedSiteConfig) {
        return [];
      }
      const config = siteConfigs?.find(c => c.id === selectedSiteConfig);
      if (!config) return [];
      
      return apiRequest(`/api/site-events/database/${config.eventsDatabase}/table/${config.eventsTableName}`);
    },
    enabled: selectedSiteConfig !== "all" && !!selectedSiteConfig && !!siteConfigs,
  });

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "bg-red-600";
      case "high": return "bg-red-500";
      case "warning": return "bg-yellow-500";
      case "medium": return "bg-orange-500";
      case "info": return "bg-blue-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const getPlcCategory = (type: string, description: string) => {
    const text = (type + " " + description).toLowerCase();
    if (text.includes("alarm") || text.includes("trip") || text.includes("fault")) return "Alarm";
    if (text.includes("motor") || text.includes("pump") || text.includes("drive")) return "Equipment";
    if (text.includes("plc") || text.includes("cpu") || text.includes("communication")) return "Control";
    if (text.includes("network") || text.includes("connection")) return "Network";
    if (text.includes("safety") || text.includes("emergency")) return "Safety";
    return "General";
  };

  const getPlcCategoryIcon = (type: string, description: string) => {
    const category = getPlcCategory(type, description);
    switch (category) {
      case "Alarm": return <AlertTriangle className="h-3 w-3" />;
      case "Equipment": return <Settings className="h-3 w-3" />;
      case "Control": return <Cpu className="h-3 w-3" />;
      case "Network": return <Activity className="h-3 w-3" />;
      case "Safety": return <AlertTriangle className="h-3 w-3" />;
      default: return <Database className="h-3 w-3" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const displayedEvents = customEvents || [];

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-600 rounded-lg shadow-sm">
            <AlertTriangle className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Site Events
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Live events from site databases
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Events List */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <div className="space-y-2">
                <Activity className="h-8 w-8 mx-auto text-gray-300 mb-2 animate-spin" />
                <p>Loading site events...</p>
              </div>
            </CardContent>
          </Card>
        ) : error || selectedSiteConfig === "all" ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <div className="space-y-2">
                <Database className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p>No events found for the selected site database.</p>
                <p className="text-sm">Configure the external database connection to view live data from your industrial systems.</p>
              </div>
            </CardContent>
          </Card>
        ) : displayedEvents.length > 0 ? (
          <div className="space-y-2">
            {displayedEvents.map((event: CustomSiteEvent, index: number) => (
              <Card key={event.id || index} className="transition-all">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${getSeverityColor(event.severity || 'info')} text-white`}>
                          <div className="flex items-center gap-1">
                            {getPlcCategoryIcon(event.type || '', event.description || '')}
                            <span className="text-xs font-medium capitalize">{event.severity || 'info'}</span>
                          </div>
                        </Badge>
                        
                        <Badge variant="outline" className="text-xs">
                          {getPlcCategory(event.type || '', event.description || '')}
                        </Badge>
                        
                        <Badge variant="secondary" className="text-xs">
                          {event.site || 'Unknown Site'}
                        </Badge>
                        
                        {event.equipment && (
                          <Badge variant="outline" className="text-xs">
                            {event.equipment}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        {event.message || event.description || 'Site Event'}
                      </h3>
                      
                      <div className="text-xs text-gray-500">
                        {event.timestamp ? formatDateTime(event.timestamp) : (event.date_time ? formatDateTime(event.date_time) : 'No timestamp')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <div className="space-y-2">
                <Database className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p>No events found.</p>
                <p className="text-sm">Events will appear here when the configured database connection is active.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}