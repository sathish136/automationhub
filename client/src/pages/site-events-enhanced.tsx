import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, AlertTriangle, CheckCircle, Clock, Filter, Search, Eye, EyeOff, Wifi, WifiOff, Timer, Network, Gauge, Fan, Beaker, Activity, Settings, Database, Server, Download } from "lucide-react";
import { CompactDateRange } from "@/components/ui/compact-date-range";
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
  siteName?: string;
  deviceName?: string;
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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateRange, setDateRange] = useState<string>("all");
  const [acknowledgedEvents, setAcknowledgedEvents] = useState<Set<string>>(new Set());
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

  // Fetch custom site events for all configurations when "all" is selected
  const { data: customEvents, isLoading: customEventsLoading } = useQuery<CustomSiteEvent[]>({
    queryKey: ["/api/site-events/custom", selectedSiteConfig],
    queryFn: async () => {
      if (!siteConfigs || siteConfigs.length === 0) return [];
      
      if (selectedSiteConfig === "all") {
        // Fetch from all configurations
        try {
          const allEvents = await Promise.all(
            siteConfigs.map(async (config) => {
              try {
                const response = await fetch(`/api/site-events/custom/${config.eventsDatabaseName}/${config.eventsTableName}?limit=50`);
                const events = await response.json();
                return events.map((event: any) => ({
                  ...event, 
                  siteName: config.siteName || config.deviceName,
                  deviceName: config.deviceName
                }));
              } catch (error) {
                console.error(`Failed to fetch events for ${config.siteName}:`, error);
                return [];
              }
            })
          );
          return allEvents.flat();
        } catch (error) {
          console.error('Failed to fetch all site events:', error);
          return [];
        }
      } else {
        // Fetch from selected configuration
        const config = siteConfigs.find(c => c.id === selectedSiteConfig);
        if (!config) return [];
        try {
          const response = await fetch(`/api/site-events/custom/${config.eventsDatabaseName}/${config.eventsTableName}?limit=100`);
          const events = await response.json();
          return events.map((event: any) => ({
            ...event, 
            siteName: config.siteName || config.deviceName,
            deviceName: config.deviceName
          }));
        } catch (error) {
          console.error(`Failed to fetch events for ${config.siteName}:`, error);
          return [];
        }
      }
    },
    enabled: !!siteConfigs && siteConfigs.length > 0,
    refetchInterval: 30000,
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
    if (!customEvents) return { critical: 0, warning: 0, total: 0 };
    
    const critical = customEvents.filter(event => event.severity?.toLowerCase() === "critical").length;
    const warning = customEvents.filter(event => event.severity?.toLowerCase() === "warning").length;
    const total = customEvents.length;
    return { critical, warning, total };
  };

  const customEventsSummary = getCustomEventsSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Site Events & Alerts" subtitle="Monitor industrial automation events and custom site-specific events" />
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 py-4">
        <div className="space-y-3">
          {/* Header Section */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-4">
              <div>
                <h1 className="text-lg font-bold text-gray-900 mb-1">Site Events & Alerts</h1>
                <p className="text-xs text-gray-600">Monitor industrial automation events, alerts, and custom site-specific events</p>
              </div>
            </div>

            <Tabs defaultValue="system-alerts" className="w-full text-xs">
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
              <TabsContent value="system-alerts" className="space-y-3 mt-3">
                {/* System Alerts Summary */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div className="text-sm font-bold text-red-600 dark:text-red-400">{siteEventsSummary.critical}</div>
                    <div className="text-xs text-gray-500">Critical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{siteEventsSummary.warning}</div>
                    <div className="text-xs text-gray-500">Warning</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{siteEventsSummary.unread}</div>
                    <div className="text-xs text-gray-500">Unread</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{filteredAlerts.length}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                </div>

                {/* System Alerts Filters */}
                <Card>
                  <CardContent className="p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                        <Input
                          placeholder="Search sites or messages..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 h-6 text-xs"
                          data-testid="input-search-events"
                        />
                      </div>
                      
                      <Select value={severityFilter} onValueChange={setSeverityFilter}>
                        <SelectTrigger className="w-28 h-6 text-xs" data-testid="select-severity-filter">
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
                        <SelectTrigger className="w-32 h-6 text-xs" data-testid="select-category-filter">
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
                        <SelectTrigger className="w-28 h-6 text-xs" data-testid="select-status-filter">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="unread">Unread</SelectItem>
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
                        className="h-6 px-2 text-xs"
                        data-testid="button-clear-filters"
                      >
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* System Alerts List */}
                <div className="space-y-2">
                  {alertsLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Card key={i}>
                          <CardContent className="p-2">
                            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : filteredAlerts.length > 0 ? (
                    filteredAlerts.map((alert) => (
                      <Card key={alert.id} className={`transition-all ${!alert.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''}`}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
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

                              <h3 className="text-sm font-semibold text-gray-900 mb-2">{alert.title}</h3>
                              <p className="text-xs text-gray-600 mb-2">{alert.message}</p>
                              
                              <div className="flex items-center gap-2 text-xs text-gray-500">
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
                                  className="text-xs h-6 px-2"
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
                                  className="text-xs h-6 px-2"
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
                      <CardContent className="p-6 text-center">
                        <Activity className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                        <h3 className="text-xs font-medium text-gray-900 mb-1">No Site Events Found</h3>
                        <p className="text-xs text-gray-600">No PLC tag events or site alerts match your current filters.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Custom Site Events Tab */}
              <TabsContent value="custom-events" className="space-y-3 mt-3">
                {/* Compact Controls */}
                <div className="bg-gray-50 border rounded p-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <Database className="h-3 w-3" />
                      <span className="font-medium">Site:</span>
                      <Select value={selectedSiteConfig} onValueChange={setSelectedSiteConfig}>
                        <SelectTrigger className="w-32 h-6 text-xs">
                          <SelectValue placeholder="All Sites" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sites</SelectItem>
                          {siteConfigs?.map(config => (
                            <SelectItem key={config.id} value={config.id}>
                              {config.siteName || config.deviceName || 'Unnamed Site'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="relative">
                        <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-2.5 w-2.5" />
                        <Input
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-6 h-6 w-24 text-xs"
                        />
                      </div>
                          
                      <CompactDateRange
                        fromDate={fromDate}
                        toDate={toDate}
                        onFromDateChange={(date) => {
                          setFromDate(date);
                          if (date && toDate) setDateRange("custom");
                        }}
                        onToDateChange={(date) => {
                          setToDate(date);
                          if (fromDate && date) setDateRange("custom");
                        }}
                        onRangeApply={() => {
                          if (fromDate || toDate) {
                            setDateRange("custom");
                          } else {
                            setDateRange("all");
                          }
                        }}
                        className="w-72"
                      />

                      <Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => { const csvData = customEvents?.map(event => ({ 'Date & Time': new Date(event.date_time).toLocaleString('en-GB'), 'Description': event.description || event.message, 'Site': event.siteName || event.deviceName || 'Site', 'Type': event.type || 'Alert', 'Severity': event.severity || 'Unknown' })) || []; const csvContent = [ Object.keys(csvData[0] || {}).join(','), ...csvData.map(row => Object.values(row).join(',')) ].join('\n'); const blob = new Blob([csvContent], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `site-events-${new Date().toISOString().split('T')[0]}.csv`; a.click(); URL.revokeObjectURL(url); }}>
                        <Download className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs">
                        <span className="font-bold text-red-600">
                          {customEvents?.filter(event => {
                            const matchesSearch = !searchTerm || (event.description || event.message).toLowerCase().includes(searchTerm.toLowerCase()) || (event.siteName || '').toLowerCase().includes(searchTerm.toLowerCase());
                            let matchesDateRange = true;
                            if (fromDate || toDate) {
                              const eventDate = new Date(event.date_time);
                              if (fromDate && toDate) {
                                const startDate = new Date(fromDate + 'T00:00:00');
                                const endDate = new Date(toDate + 'T23:59:59');
                                matchesDateRange = eventDate >= startDate && eventDate <= endDate;
                              } else if (fromDate) {
                                const startDate = new Date(fromDate + 'T00:00:00');
                                matchesDateRange = eventDate >= startDate;
                              } else if (toDate) {
                                const endDate = new Date(toDate + 'T23:59:59');
                                matchesDateRange = eventDate <= endDate;
                              }
                            }
                            return matchesSearch && matchesDateRange;
                          }).length || 0}
                        </span> Critical
                      </span>
                      <span className="text-xs">
                        <span className="font-bold text-green-600">{acknowledgedEvents.size}</span> Acknowledged
                      </span>
                    </div>
                  </div>
                </div>



                {/* Equipment Alerts List */}
                <Card>
                  <CardContent className="p-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Equipment Alerts</h3>
                    <p className="text-xs text-gray-500 mb-2">Real-time equipment status from monitoring sites</p>
                    {customEventsLoading ? (
                      <div className="space-y-1">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : customEvents && customEvents.length > 0 ? (
                      <div className="space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto">
                        {customEvents
                          .filter(event => {
                            // Search filter
                            const matchesSearch = !searchTerm || 
                              (event.description || event.message).toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (event.siteName || '').toLowerCase().includes(searchTerm.toLowerCase());
                            
                            // Date range filter
                            let matchesDateRange = true;
                            if (fromDate || toDate) {
                              const eventDate = new Date(event.date_time);
                              
                              if (fromDate && toDate) {
                                // Both dates selected
                                const startDate = new Date(fromDate + 'T00:00:00');
                                const endDate = new Date(toDate + 'T23:59:59');
                                matchesDateRange = eventDate >= startDate && eventDate <= endDate;
                                if (!matchesDateRange) {
                                  console.log(`Event ${event.description} filtered out: ${event.date_time} not between ${startDate} and ${endDate}`);
                                }
                              } else if (fromDate) {
                                // Only from date selected
                                const startDate = new Date(fromDate + 'T00:00:00');
                                matchesDateRange = eventDate >= startDate;
                                if (!matchesDateRange) {
                                  console.log(`Event ${event.description} filtered out: ${event.date_time} before ${startDate}`);
                                }
                              } else if (toDate) {
                                // Only to date selected
                                const endDate = new Date(toDate + 'T23:59:59');
                                matchesDateRange = eventDate <= endDate;
                                if (!matchesDateRange) {
                                  console.log(`Event ${event.description} filtered out: ${event.date_time} after ${endDate}`);
                                }
                              }
                            }
                            
                            return matchesSearch && matchesDateRange;
                          })
                          .map((event, index) => {
                            const eventKey = `${event.date_time}-${event.description || event.message}`;
                            const isAcknowledged = acknowledgedEvents.has(eventKey);
                            
                            return (
                              <div key={eventKey} className={`flex items-center justify-between p-1 border rounded text-xs transition-colors ${isAcknowledged ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200 hover:bg-red-100'}`}>
                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                  <div className={`w-0.5 h-4 rounded-full ${isAcknowledged ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  <Badge className={`text-xs px-1 py-0 ${isAcknowledged ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                    <AlertCircle className="h-1.5 w-1.5 mr-0.5" />
                                    {isAcknowledged ? 'ACK' : 'Alert'}
                                  </Badge>
                                  <span className="font-medium text-gray-900 flex-1 truncate">{event.description || event.message}</span>
                                  <span className="text-blue-600 bg-blue-100 px-1 py-0 rounded font-medium text-xs">{event.siteName || event.deviceName || 'Site'}</span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <div className="text-gray-500 flex items-center gap-0.5">
                                    <Clock className="h-1.5 w-1.5" />
                                    {new Date(event.date_time).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  {!isAcknowledged && (
                                    <button className="px-1 py-0 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-xs" onClick={() => { const newAcknowledged = new Set(acknowledgedEvents); newAcknowledged.add(eventKey); setAcknowledgedEvents(newAcknowledged); toast({ title: "Alert Acknowledged", description: `${event.description || event.message} by Admin@${event.siteName || event.deviceName || 'Site'}` }); }}>ACK</button>
                                  )}
                                  {isAcknowledged && (
                                    <span className="text-green-600 font-medium text-xs">✓ Admin@{event.siteName || event.deviceName || 'Site'}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-3">
                        <Database className="h-4 w-4 mx-auto text-gray-300 mb-1" />
                        <h3 className="text-xs font-medium text-gray-900">No Equipment Alerts</h3>
                        <p className="text-xs text-gray-600">All systems running normally</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}