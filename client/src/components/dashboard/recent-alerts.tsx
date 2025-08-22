import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Site } from "@shared/schema";

export default function RecentAlerts() {
  const { data: sites, isLoading } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getSeverityColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getSeverityTextColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-600";
      case "offline":
        return "text-red-600";
      case "warning":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const formatTimeAgo = (updatedAt: string | Date) => {
    const date = new Date(updatedAt);
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

  const getSiteEvents = () => {
    if (!sites) return [];
    
    return sites.map(site => ({
      id: site.id,
      title: `Site ${site.name} is ${site.status}`,
      message: `Site ${site.name} (${site.ipAddress}) is ${site.status === 'offline' ? 'not responding to ping requests. Connection timeout' : 'responding normally'}`,
      status: site.status,
      updatedAt: site.updatedAt
    })).slice(0, 3);
  };

  const siteEvents = getSiteEvents();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : siteEvents && siteEvents.length > 0 ? (
            siteEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50"
                data-testid={`event-${event.id}`}
              >
                <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(event.status)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {event.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {event.message}
                  </p>
                  <span className={`text-xs ${getSeverityTextColor(event.status)}`}>
                    {event.updatedAt && formatTimeAgo(event.updatedAt)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No recent site events</p>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          className="w-full mt-4"
          asChild
          data-testid="view-all-events"
        >
          <Link href="/site-events">
            View All Events
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
