import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, AlertTriangle, CheckCircle, Clock, Filter, Search, Eye, EyeOff, Wifi, WifiOff, Timer, Network, Gauge, Fan, Beaker, Activity, Settings, Database, Server } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Alert {
  id: string;
  siteId: string | null;
  type: string;
  severity: string;
  title: string;
  message: string;
  isRead: boolean;
  isResolved: boolean;
  metadata: any;
  createdAt: string;
  resolvedAt: string | null;
}

interface Site {
  id: string;
  name: string;
  ipAddress: string;
  status: string;
}

interface SiteEventConfiguration {
  id: string;
  siteName: string;
  deviceName: string;
  eventsDatabaseName: string;
  eventsTableName: string;
}

interface CustomSiteEvent {
  id: string;
  date_time: string;
  severity: string;
  type: string;
  message: string;
  description: string;
  source: string;
  status: string;
  site: string;
  equipment?: string;
  tag_value?: number;
  setpoint?: number;
  note?: string;
  isRead?: boolean;
  isResolved?: boolean;
}

export default function SiteEvents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedSiteConfig, setSelectedSiteConfig] = useState<string>("all");
  const { toast } = useToast();

  const { data: sites } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
  });

  // Fetch site event configurations
  const { data: siteConfigs } = useQuery<SiteEventConfiguration[]>({
    queryKey: ["/api/site-events/configurations"],
  });

  // Fetch custom site events for selected configuration
  const { data: customEvents, isLoading: customEventsLoading } = useQuery<CustomSiteEvent[]>({
    queryKey: ["/api/site-events/custom", selectedSiteConfig],
    queryFn: () => {
      if (selectedSiteConfig === "all" || !selectedSiteConfig) return [];
      const config = siteConfigs?.find(c => c.id === selectedSiteConfig);
      if (!config) return [];
      return fetch(`/api/site-events/custom/${config.eventsDatabaseName}/${config.eventsTableName}?limit=100`)
        .then(res => res.json());
    },
    enabled: selectedSiteConfig !== "all" && !!siteConfigs,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500 hover:bg-red-600";
      case "warning":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "info":
        return "bg-blue-500 hover:bg-blue-600";
      case "success":
        return "bg-green-500 hover:bg-green-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-yellow-600 dark:text-yellow-400";
      case "info":
        return "text-blue-600 dark:text-blue-400";
      case "success":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getPlcCategoryIcon = (type: string, message: string) => {
    if (type === "plc_tag_trip" || message.toLowerCase().includes("trip")) {
      return <AlertTriangle className="h-4 w-4 text-white" />;
    }
    if (type === "plc_tag_alarm" || message.toLowerCase().includes("alarm")) {
      return <AlertCircle className="h-4 w-4 text-white" />;
    }
    if (message.toLowerCase().includes("pump")) {
      return <Gauge className="h-4 w-4 text-white" />;
    }
    if (message.toLowerCase().includes("blower") || message.toLowerCase().includes("aeration")) {
      return <Fan className="h-4 w-4 text-white" />;
    }
    if (message.toLowerCase().includes("chemical") || message.toLowerCase().includes("dosing")) {
      return <Beaker className="h-4 w-4 text-white" />;
    }
    if (message.toLowerCase().includes("flow") || message.toLowerCase().includes("pressure") || message.toLowerCase().includes("level")) {
      return <Activity className="h-4 w-4 text-white" />;
    }
    if (type === "site_offline" || message.toLowerCase().includes("offline")) {
      return <WifiOff className="h-4 w-4 text-white" />;
    }
    return <Settings className="h-4 w-4 text-white" />;
  };

  const getPlcCategory = (type: string, message: string) => {
    if (type === "plc_tag_trip" || message.toLowerCase().includes("trip")) {
      return "Equipment Trip";
    }
    if (type === "plc_tag_alarm" || message.toLowerCase().includes("alarm")) {
      return "Process Alarm";
    }
    if (message.toLowerCase().includes("pump")) {
      return "Pump Systems";
    }
    if (message.toLowerCase().includes("blower") || message.toLowerCase().includes("aeration")) {
      return "Aeration Systems";
    }
    if (message.toLowerCase().includes("chemical") || message.toLowerCase().includes("dosing")) {
      return "Chemical Systems";
    }
    if (message.toLowerCase().includes("flow") || message.toLowerCase().includes("pressure") || message.toLowerCase().includes("level")) {
      return "Process Monitoring";
    }
    if (type === "site_offline" || message.toLowerCase().includes("offline")) {
      return "Site Connection";
    }
    return "Other";
  };

  const getSiteName = (siteId: string | null) => {
    if (!siteId || !sites) return "System";
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : "Unknown Site";
  };

  const displayedEvents = customEvents?.filter(event => 
    (event.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (event.site?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Site Events - UPDATED</h1>
        <p className="text-sm text-gray-500">Live events from the selected site database - Showing real data</p>
      </div>

      {/* Compact Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={selectedSiteConfig} onValueChange={setSelectedSiteConfig}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Site Database" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Select a Site Database to view events</SelectItem>
                {siteConfigs?.map(config => (
                  <SelectItem key={config.id} value={config.id}>
                    {config.siteName} - {config.eventsTableName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <div className="space-y-4">
        {customEventsLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-2">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : selectedSiteConfig === "all" || !selectedSiteConfig ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              <div className="space-y-2">
                <Database className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p>Please select a site database to view events.</p>
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
                      <p className="text-xs text-gray-600 mb-2">{event.description}</p>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(event.date_time).toLocaleString()}
                        </div>
                        {event.tag_value && (
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3" />
                            Value: {event.tag_value}
                          </div>
                        )}
                        {event.setpoint && (
                          <div className="flex items-center gap-1">
                            <Settings className="h-3 w-3" />
                            Setpoint: {event.setpoint}
                          </div>
                        )}
                      </div>
                      
                      {event.note && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                          Note: {event.note}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="text-xs text-gray-500 text-right">
                        #{index + 1}
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
                <p>No events found for the selected site database.</p>
                <p className="text-sm">Configure the external database connection to view live data from your industrial systems.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};