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
import Header from "@/components/layout/header";

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
}

export default function SiteEventsEnhanced() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedSiteConfig, setSelectedSiteConfig] = useState<string>("all");
  const { toast } = useToast();

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

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

  const markAsReadMutation = useMutation({
    mutationFn: (alertId: string) => apiRequest(`/api/alerts/${alertId}/read`, "PUT"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Success",
        description: "Alert marked as read",
      });
    },
  });

  const markAsResolvedMutation = useMutation({
    mutationFn: (alertId: string) => apiRequest(`/api/alerts/${alertId}/resolve`, "PUT"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      toast({
        title: "Success",
        description: "Alert marked as resolved",
      });
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-500 hover:bg-red-600";
      case "warning":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "info":
        return "bg-blue-500 hover:bg-blue-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return <AlertCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "info":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
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

  const formatTimeAgo = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Filter to show PLC tag and site events
  const plcEventTypes = ["plc_tag_trip", "plc_tag_alarm", "site_offline", "equipment_failure"];
  
  const filteredAlerts = alerts?.filter(alert => {
    // Show PLC tag events and critical site events
    const isPlcEvent = plcEventTypes.includes(alert.type) || 
                      alert.message.toLowerCase().includes("trip") ||
                      alert.message.toLowerCase().includes("pump") ||
                      alert.message.toLowerCase().includes("blower") ||
                      alert.message.toLowerCase().includes("alarm") ||
                      alert.message.toLowerCase().includes("chemical") ||
                      alert.message.toLowerCase().includes("offline");
    
    if (!isPlcEvent) return false;
    
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getSiteName(alert.siteId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesType = typeFilter === "all" || alert.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || getPlcCategory(alert.type, alert.message) === categoryFilter;
    
    let matchesStatus = true;
    if (statusFilter === "unread") {
      matchesStatus = !alert.isRead;
    } else if (statusFilter === "unresolved") {
      matchesStatus = !alert.isResolved;
    } else if (statusFilter === "resolved") {
      matchesStatus = alert.isResolved;
    }
    
    return matchesSearch && matchesSeverity && matchesType && matchesCategory && matchesStatus;
  }) || [];

  const eventTypes = Array.from(new Set(filteredAlerts?.map(alert => alert.type) || []));
  
  // Available PLC categories
  const plcCategories = Array.from(new Set(
    alerts?.filter(alert => {
      const isPlcEvent = plcEventTypes.includes(alert.type) || 
                        alert.message.toLowerCase().includes("trip") ||
                        alert.message.toLowerCase().includes("pump") ||
                        alert.message.toLowerCase().includes("blower") ||
                        alert.message.toLowerCase().includes("alarm") ||
                        alert.message.toLowerCase().includes("chemical") ||
                        alert.message.toLowerCase().includes("offline");
      return isPlcEvent;
    }).map(alert => getPlcCategory(alert.type, alert.message)) || []
  ));
  
  // Site events summary
  const getSiteEventsSummary = () => {
    const critical = filteredAlerts.filter(alert => alert.severity === "critical").length;
    const warning = filteredAlerts.filter(alert => alert.severity === "warning").length;
    const unread = filteredAlerts.filter(alert => !alert.isRead).length;
    return { critical, warning, unread };
  };

  const siteEventsSummary = getSiteEventsSummary();

  // Custom events summary
  const getCustomEventsSummary = () => {
    if (!customEvents) return { critical: 0, warning: 0, active: 0 };
    
    const critical = customEvents.filter(event => event.severity?.toLowerCase() === "critical").length;
    const warning = customEvents.filter(event => event.severity?.toLowerCase() === "warning").length;
    const active = customEvents.filter(event => event.status?.toLowerCase() === "active").length;
    return { critical, warning, active };
  };

  const customEventsSummary = getCustomEventsSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Site Events & Alerts</h1>
                <p className="text-gray-600">Monitor industrial automation events, alerts, and custom site-specific events</p>
              </div>
            </div>

            <Tabs defaultValue="system-alerts" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="system-alerts">
                  <Activity className="h-4 w-4 mr-2" />
                  System Alerts
                </TabsTrigger>
                <TabsTrigger value="custom-events">
                  <Database className="h-4 w-4 mr-2" />
                  Custom Site Events
                </TabsTrigger>
              </TabsList>

              {/* System Alerts Tab */}
              <TabsContent value="system-alerts" className="space-y-6 mt-6">
                {/* System Alerts Summary */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">{siteEventsSummary.critical}</div>
                    <div className="text-xs text-gray-500">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{siteEventsSummary.warning}</div>
                    <div className="text-xs text-gray-500">Warning</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{siteEventsSummary.unread}</div>
                    <div className="text-xs text-gray-500">Unread</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{filteredAlerts.length}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                </div>

                {/* System Alerts Filters */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search sites or messages..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 h-9"
                          data-testid="input-search-events"
                        />
                      </div>
                      
                      <Select value={severityFilter} onValueChange={setSeverityFilter}>
                        <SelectTrigger className="w-32 h-9" data-testid="select-severity-filter">
                          <SelectValue placeholder="Severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="info">Info</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-40 h-9" data-testid="select-category-filter">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {plcCategories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32 h-9" data-testid="select-status-filter">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="unread">Unread</SelectItem>
                          <SelectItem value="unresolved">Active</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSearchTerm("");
                          setSeverityFilter("all");
                          setTypeFilter("all");
                          setCategoryFilter("all");
                          setStatusFilter("all");
                        }}
                        className="h-9"
                        data-testid="button-clear-filters"
                      >
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* System Alerts List */}
                <div className="space-y-4">
                  {alertsLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-6">
                            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredAlerts.length > 0 ? (
                    filteredAlerts.map((alert) => (
                      <Card key={alert.id} className={`transition-all ${!alert.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3">
                                <Badge className={`${getSeverityColor(alert.severity)} text-white`}>
                                  <div className="flex items-center gap-1">
                                    {getSeverityIcon(alert.severity)}
                                    <span className="text-xs font-medium capitalize">{alert.severity}</span>
                                  </div>
                                </Badge>
                                
                                <Badge variant="outline" className="text-xs">
                                  {getPlcCategory(alert.type, alert.message)}
                                </Badge>
                                
                                <Badge variant="secondary" className="text-xs">
                                  {getSiteName(alert.siteId)}
                                </Badge>
                                
                                {!alert.isRead && (
                                  <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">
                                    Unread
                                  </Badge>
                                )}
                                
                                {alert.isResolved && (
                                  <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Resolved
                                  </Badge>
                                )}
                              </div>

                              <h3 className="text-base font-semibold text-gray-900 mb-2">{alert.title}</h3>
                              <p className="text-sm text-gray-600 mb-3">{alert.message}</p>
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTimeAgo(alert.createdAt)}
                                </div>
                                <div>{formatDate(alert.createdAt)}</div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              {!alert.isRead && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => markAsReadMutation.mutate(alert.id)}
                                  disabled={markAsReadMutation.isPending}
                                  className="text-xs"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Mark Read
                                </Button>
                              )}
                              
                              {!alert.isResolved && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => markAsResolvedMutation.mutate(alert.id)}
                                  disabled={markAsResolvedMutation.isPending}
                                  className="text-xs"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resolve
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Activity className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Site Events Found</h3>
                        <p className="text-gray-600">No PLC tag events or site alerts match your current filters.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Custom Site Events Tab */}
              <TabsContent value="custom-events" className="space-y-6 mt-6">
                {/* Site Configuration Selection */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Site Database:</span>
                      </div>
                      
                      <Select value={selectedSiteConfig} onValueChange={setSelectedSiteConfig}>
                        <SelectTrigger className="w-64 h-9">
                          <SelectValue placeholder="Select site configuration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Select a site configuration</SelectItem>
                          {siteConfigs?.map(config => (
                            <SelectItem key={config.id} value={config.id}>
                              {config.siteName} - {config.eventsDatabaseName}.{config.eventsTableName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedSiteConfig !== "all" && siteConfigs?.find(c => c.id === selectedSiteConfig) && (
                        <Badge variant="outline" className="text-xs">
                          <Database className="h-3 w-3 mr-1" />
                          {siteConfigs.find(c => c.id === selectedSiteConfig)?.eventsDatabaseName}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Custom Events Summary */}
                {selectedSiteConfig !== "all" && (
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-600 dark:text-red-400">{customEventsSummary.critical}</div>
                      <div className="text-xs text-gray-500">Critical</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{customEventsSummary.warning}</div>
                      <div className="text-xs text-gray-500">Warning</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">{customEventsSummary.active}</div>
                      <div className="text-xs text-gray-500">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{customEvents?.length || 0}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                  </div>
                )}

                {/* Custom Events List */}
                <div className="space-y-4">
                  {selectedSiteConfig === "all" ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Database className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Select Site Configuration</h3>
                        <p className="text-gray-600">Choose a site configuration to view custom database events.</p>
                        {(!siteConfigs || siteConfigs.length === 0) && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-700">
                              <strong>Configuration Required:</strong> Configure site event databases in IPC Management settings to enable custom event viewing.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : customEventsLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-6">
                            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : customEvents && customEvents.length > 0 ? (
                    customEvents.map((event) => (
                      <Card key={event.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3">
                                <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
                                  <div className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    <span className="text-xs font-medium">Info</span>
                                  </div>
                                </Badge>
                              </div>

                              <h3 className="text-base font-semibold text-gray-900 mb-2">{event.description || event.message}</h3>
                              
                              <div className="text-sm text-gray-600 mb-3">
                                <span className="font-medium">Source:</span> 
                              </div>
                              
                              {event.note && (
                                <div className="p-2 bg-gray-50 rounded text-sm text-gray-600 mb-3">
                                  <strong>Note:</strong> {event.note}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(event.date_time)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Database className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Events Found</h3>
                        <p className="text-gray-600">No events found in the configured database table. This could be due to:</p>
                        <ul className="text-sm text-gray-500 mt-2 space-y-1">
                          <li>• Database connection unavailable</li>
                          <li>• Empty table or no matching records</li>
                          <li>• Configuration needs verification</li>
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}