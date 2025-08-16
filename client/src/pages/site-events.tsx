import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Clock, Filter, Search, Eye, EyeOff, Wifi, WifiOff, Timer, Network } from "lucide-react";
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

export default function SiteEvents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: alerts, isLoading: alertsLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: sites } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
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

  const getNetworkCategoryIcon = (type: string, severity: string) => {
    switch (type) {
      case "site_offline":
        return <WifiOff className="h-4 w-4 text-white" />;
      case "high_response_time":
        return <Timer className="h-4 w-4 text-white" />;
      case "connection_timeout":
        return <Network className="h-4 w-4 text-white" />;
      case "communication_error":
        return <AlertCircle className="h-4 w-4 text-white" />;
      default:
        return <Wifi className="h-4 w-4 text-white" />;
    }
  };

  const getNetworkCategory = (type: string, message: string) => {
    if (type === "site_offline" || message.includes("is not responding")) {
      return "Connection Lost";
    }
    if (type === "high_response_time" || message.includes("response time")) {
      return "High Latency";
    }
    if (message.includes("timeout")) {
      return "Timeout";
    }
    if (message.includes("permission") || message.includes("capability")) {
      return "Permission Error";
    }
    return "Network Issue";
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

  // Filter to only show site/network-related events
  const networkEventTypes = ["site_offline", "high_response_time", "communication_error", "connection_timeout"];
  
  const filteredAlerts = alerts?.filter(alert => {
    // Only show network/site events
    const isNetworkEvent = networkEventTypes.includes(alert.type) || 
                          alert.message.toLowerCase().includes("ping") ||
                          alert.message.toLowerCase().includes("timeout") ||
                          alert.message.toLowerCase().includes("connection") ||
                          alert.message.toLowerCase().includes("response time") ||
                          alert.message.toLowerCase().includes("offline");
    
    if (!isNetworkEvent) return false;
    
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getSiteName(alert.siteId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesType = typeFilter === "all" || alert.type === typeFilter;
    
    let matchesStatus = true;
    if (statusFilter === "unread") {
      matchesStatus = !alert.isRead;
    } else if (statusFilter === "unresolved") {
      matchesStatus = !alert.isResolved;
    } else if (statusFilter === "resolved") {
      matchesStatus = alert.isResolved;
    }
    
    return matchesSearch && matchesSeverity && matchesType && matchesStatus;
  }) || [];

  const eventTypes = Array.from(new Set(filteredAlerts?.map(alert => alert.type) || []));
  
  // Network status summary
  const getNetworkSummary = () => {
    const critical = filteredAlerts.filter(a => a.severity === "critical" && !a.isResolved).length;
    const warning = filteredAlerts.filter(a => a.severity === "warning" && !a.isResolved).length;
    const unread = filteredAlerts.filter(a => !a.isRead).length;
    return { critical, warning, unread };
  };
  
  const networkSummary = getNetworkSummary();

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Network Events</h1>
          <p className="text-sm text-gray-500">Real-time network monitoring and connectivity alerts</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-red-600 dark:text-red-400">{networkSummary.critical}</div>
            <div className="text-xs text-gray-500">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{networkSummary.warning}</div>
            <div className="text-xs text-gray-500">Warning</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{networkSummary.unread}</div>
            <div className="text-xs text-gray-500">Unread</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{filteredAlerts.length}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>

      {/* Compact Filters */}
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

      {/* Events List */}
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
            <Card key={alert.id} className={`transition-all hover:shadow-md ${!alert.isRead ? 'ring-2 ring-blue-200 dark:ring-blue-400' : ''}`} data-testid={`alert-card-${alert.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)} shrink-0`}>
                      {getNetworkCategoryIcon(alert.type, alert.severity)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {getSiteName(alert.siteId)}
                        </h3>
                        <Badge variant="outline" className={`text-xs ${getSeverityTextColor(alert.severity)}`}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800">
                          {getNetworkCategory(alert.type, alert.message)}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                        {alert.message}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatTimeAgo(alert.createdAt)}</span>
                        <span className="opacity-70">{formatDate(alert.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-3">
                    {!alert.isRead && (
                      <Badge variant="secondary" className="text-xs px-2 py-1">
                        New
                      </Badge>
                    )}
                    {alert.isResolved && (
                      <Badge variant="default" className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Resolved
                      </Badge>
                    )}
                    
                    <div className="flex gap-1">
                      {!alert.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsReadMutation.mutate(alert.id)}
                          disabled={markAsReadMutation.isPending}
                          className="h-8 w-8 p-0"
                          data-testid={`button-mark-read-${alert.id}`}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {!alert.isResolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsResolvedMutation.mutate(alert.id)}
                          disabled={markAsResolvedMutation.isPending}
                          className="h-8 w-8 p-0"
                          data-testid={`button-resolve-${alert.id}`}
                        >
                          <CheckCircle className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Network className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No network events found
              </h3>
              <p className="text-sm text-gray-500">
                {searchTerm || severityFilter !== "all" || typeFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters to see more network events."
                  : "All sites are running smoothly - no connectivity issues detected."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}