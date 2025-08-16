import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { RefreshCw, ExternalLink, Settings, Wrench } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { Site } from "@shared/schema";

export default function SiteStatusOverview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: sites, isLoading } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const pingAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/ping/all");
    },
    onSuccess: () => {
      toast({
        title: "Ping Check Initiated",
        description: "Checking all sites for connectivity...",
      });
      // Invalidate sites to refresh the data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      }, 5000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to initiate ping check",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Online</Badge>;
      case "offline":
        return <Badge variant="destructive">Offline</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusIndicator = (status: string) => {
    const baseClass = "w-3 h-3 rounded-full";
    switch (status) {
      case "online":
        return `${baseClass} bg-green-500 animate-pulse`;
      case "offline":
        return `${baseClass} bg-red-500 animate-pulse`;
      case "warning":
        return `${baseClass} bg-yellow-500`;
      default:
        return `${baseClass} bg-gray-400`;
    }
  };

  const formatUptime = (uptime: string | number | null) => {
    if (!uptime) return "N/A";
    const uptimeNum = typeof uptime === "string" ? parseFloat(uptime) : uptime;
    return `${uptimeNum.toFixed(1)}%`;
  };

  const formatResponseTime = (responseTime: number | null) => {
    if (!responseTime) return "N/A";
    return `${responseTime}ms`;
  };

  const formatLastSeen = (lastOnline: string | null) => {
    if (!lastOnline) return "Never";
    const date = new Date(lastOnline);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Site Status Overview</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => pingAllMutation.mutate()}
              disabled={pingAllMutation.isPending}
              data-testid="refresh-sites-button"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${pingAllMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Select defaultValue="all">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="warehouse">Warehouse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : sites && sites.length > 0 ? (
            sites.map((site) => (
              <div
                key={site.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                data-testid={`site-${site.id}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className={getStatusIndicator(site.status)} />
                    <span className="font-medium text-gray-900">{site.name}</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <span className="mr-1">📍</span>
                      {site.ipAddress}
                    </span>
                    {site.status === "online" ? (
                      <span className="flex items-center">
                        <span className="mr-1">⏱️</span>
                        {formatResponseTime(site.responseTime)}
                      </span>
                    ) : (
                      <span className="text-red-600">
                        Last seen: {formatLastSeen(site.lastOnline)}
                      </span>
                    )}
                    <span className={site.status === "online" ? "text-green-600" : "text-red-600"}>
                      {formatUptime(site.uptime)} uptime
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(site.status)}
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    data-testid={`view-site-${site.id}`}
                  >
                    <Link href={`/sites?selected=${site.id}`}>
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid={`manage-site-${site.id}`}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No sites configured yet.</p>
              <Button asChild className="mt-2">
                <Link href="/sites">
                  Add your first site
                </Link>
              </Button>
            </div>
          )}
        </div>
        
        {sites && sites.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Button variant="ghost" asChild data-testid="view-all-sites">
              <Link href="/sites">
                View All Sites →
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
