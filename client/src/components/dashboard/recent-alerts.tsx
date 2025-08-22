import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AlertCircle, AlertTriangle, CheckCircle, Clock, Eye, ExternalLink } from "lucide-react";
import type { Alert } from "@shared/schema";

export default function RecentAlerts() {
  const { data: alerts, isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: sites } = useQuery<any[]>({
    queryKey: ["/api/sites"],
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
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

  const formatTimeAgo = (createdAt: string | Date) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  const getSiteName = (siteId: string | null) => {
    if (!siteId || !sites) return "System";
    const site = sites.find(s => s.id === siteId);
    return site ? site.name : "Unknown Site";
  };

  // Show more recent alerts and filter for important ones
  const recentAlerts = alerts?.slice(0, 6) || [];
  const criticalCount = alerts?.filter(alert => alert.severity === "critical").length || 0;
  const unreadCount = alerts?.filter(alert => !alert.isRead).length || 0;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Alerts Dashboard</CardTitle>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs">
                {criticalCount} Critical
              </Badge>
            )}
            {unreadCount > 0 && (
              <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600">Live monitoring of system alerts and equipment status</p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : recentAlerts.length > 0 ? (
            recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-3 transition-all hover:bg-gray-50 ${!alert.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''}`}
                data-testid={`alert-${alert.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${getSeverityColor(alert.severity)} text-white`}>
                        <div className="flex items-center gap-1">
                          {getSeverityIcon(alert.severity)}
                          <span className="text-xs font-medium capitalize">{alert.severity}</span>
                        </div>
                      </Badge>
                      
                      <Badge variant="secondary" className="text-xs">
                        {getSiteName(alert.siteId)}
                      </Badge>
                      
                      {!alert.isRead && (
                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-700">
                          <Eye className="h-3 w-3 mr-1" />
                          Unread
                        </Badge>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
                      {alert.title}
                    </h4>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {alert.message}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {alert.createdAt && formatTimeAgo(alert.createdAt)}
                      </div>
                      <div>{alert.createdAt && new Date(alert.createdAt).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      asChild
                    >
                      <Link href="/site-events">
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-medium">No recent alerts</p>
              <p className="text-xs">All systems running normally</p>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            asChild
            data-testid="view-all-alerts"
          >
            <Link href="/site-events">
              <ExternalLink className="h-4 w-4 mr-2" />
              View All Events
            </Link>
          </Button>
          
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              Mark All Read ({unreadCount})
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
