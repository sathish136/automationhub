import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Activity, Clock, Globe, Wifi, WifiOff, AlertTriangle, RotateCw, Plus, Grid, List, Trash2 } from "lucide-react";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Site, type IpcManagement, type UptimeHistory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

function SiteStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "online":
      return <Wifi className="h-4 w-4 text-green-500" />;
    case "offline":
      return <WifiOff className="h-4 w-4 text-red-500" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Globe className="h-4 w-4 text-gray-400" />;
  }
}

function SiteStatusBadge({ status }: { status: string }) {
  const variants = {
    online: "bg-green-100 text-green-800 border-green-200",
    offline: "bg-red-100 text-red-800 border-red-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    unknown: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <Badge
      variant="outline"
      className={variants[status as keyof typeof variants] || variants.unknown}
    >
      <SiteStatusIcon status={status} />
      <span className="ml-1 capitalize">{status}</span>
    </Badge>
  );
}

function SyncFromIPCButton() {
  const { toast } = useToast();

  const syncFromIPCMutation = useMutation({
    mutationFn: () => apiRequest("/api/sites/sync-from-ipc", "POST"),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      
      const created = data.created || 0;
      const removed = data.removed || 0;
      let description = "";
      
      if (created > 0 && removed > 0) {
        description = `${created} sites created, ${removed} orphaned sites removed.`;
      } else if (created > 0) {
        description = `${created} sites created from IPC management records.`;
      } else if (removed > 0) {
        description = `${removed} orphaned sites removed.`;
      } else {
        description = "All sites are already synchronized with IPC management.";
      }
      
      toast({
        title: "Sites synced successfully",
        description,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to sync sites",
        description: error.message || "An error occurred while syncing sites from IPC management.",
      });
    },
  });

  return (
    <Button
      onClick={() => syncFromIPCMutation.mutate()}
      disabled={syncFromIPCMutation.isPending}
      variant="outline"
      data-testid="sync-ipc-button"
    >
      <RotateCw className={`h-4 w-4 mr-2 ${syncFromIPCMutation.isPending ? 'animate-spin' : ''}`} />
      {syncFromIPCMutation.isPending ? "Syncing..." : "Sync from IPC"}
    </Button>
  );
}

function UptimeBar({ siteId }: { siteId: string }) {
  const { data: uptimeHistory = [] } = useQuery<UptimeHistory[]>({
    queryKey: ["/api/sites", siteId, "uptime"],
    refetchInterval: 60000, // Refresh every minute
  });

  // Get last 96 data points (24 hours if checking every 15 minutes)
  const recentHistory = uptimeHistory.slice(0, 96);
  const totalBars = 96;
  
  // Fill missing data with unknown status
  const bars = Array.from({ length: totalBars }, (_, i) => {
    const historyItem = recentHistory[i];
    if (historyItem) {
      return {
        status: historyItem.isOnline ? 'online' : 'offline',
        timestamp: historyItem.timestamp,
        responseTime: historyItem.responseTime
      };
    }
    return { status: 'unknown', timestamp: null, responseTime: null };
  });

  const getBarColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="flex space-x-0.5 h-8 items-center">
      {bars.map((bar, index) => (
        <div
          key={index}
          className={`w-1 h-6 rounded-sm ${getBarColor(bar.status)}`}
          title={bar.timestamp ? `${bar.status} - ${new Date(bar.timestamp).toLocaleString()}${bar.responseTime ? ` (${bar.responseTime}ms)` : ''}` : 'No data'}
        />
      ))}
    </div>
  );
}

function SiteListItem({ site, ipcDevice, onDelete, isDeleting }: { site: Site; ipcDevice?: IpcManagement; onDelete: (siteId: string, siteName: string) => void; isDeleting: boolean }) {
  const uptimePercentage = site.uptime ? parseFloat(site.uptime) : 0;
  const responseTime = site.responseTime || 0;
  const lastCheck = site.lastCheck ? new Date(site.lastCheck) : null;

  return (
    <div className="border rounded-lg p-4 bg-white hover:shadow-sm transition-shadow" data-testid={`list-site-${site.id}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <SiteStatusIcon status={site.status} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-sm truncate" data-testid={`text-list-name-${site.id}`}>
                  {ipcDevice?.deviceName || site.name}
                </h3>
                <SiteStatusBadge status={site.status} />
              </div>
              <p className="text-xs text-muted-foreground" data-testid={`text-list-ip-${site.id}`}>
                {site.ipAddress}
                {ipcDevice?.amsNetId && ` • AMS: ${ipcDevice.amsNetId}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Uptime</div>
              <div className="font-medium" data-testid={`text-list-uptime-${site.id}`}>
                {uptimePercentage.toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Response</div>
              <div className="font-medium" data-testid={`text-list-response-${site.id}`}>
                {responseTime > 0 ? `${responseTime}ms` : "—"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Last Check</div>
              <div className="font-medium text-xs" data-testid={`text-list-check-${site.id}`}>
                {lastCheck ? formatDistanceToNow(lastCheck, { addSuffix: true }) : "Never"}
              </div>
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex-shrink-0 flex items-center space-x-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">24h Status</div>
            <UptimeBar siteId={site.id} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(site.id, site.name)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            data-testid={`delete-list-site-${site.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Additional IPC info in collapsed view */}
      {ipcDevice && (ipcDevice.lanIp || ipcDevice.vpnIp || ipcDevice.anydesk) && (
        <div className="mt-3 pt-3 border-t flex items-center space-x-4 text-xs text-muted-foreground">
          {ipcDevice.lanIp && (
            <span>LAN: {ipcDevice.lanIp}</span>
          )}
          {ipcDevice.vpnIp && (
            <span>VPN: {ipcDevice.vpnIp}</span>
          )}
          {ipcDevice.anydesk && (
            <span>AnyDesk: {ipcDevice.anydesk}</span>
          )}
        </div>
      )}
    </div>
  );
}

function SiteCard({ site, ipcDevice, onDelete, isDeleting }: { site: Site; ipcDevice?: IpcManagement; onDelete: (siteId: string, siteName: string) => void; isDeleting: boolean }) {
  const uptimePercentage = site.uptime ? parseFloat(site.uptime) : 0;
  const responseTime = site.responseTime || 0;
  const lastCheck = site.lastCheck ? new Date(site.lastCheck) : null;
  const lastOnline = site.lastOnline ? new Date(site.lastOnline) : null;

  return (
    <Card className="transition-all hover:shadow-md" data-testid={`card-site-${site.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SiteStatusIcon status={site.status} />
            <div>
              <CardTitle className="text-base" data-testid={`text-site-name-${site.id}`}>
                {ipcDevice?.deviceName || site.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground" data-testid={`text-site-ip-${site.id}`}>
                {site.ipAddress}
              </p>
              {ipcDevice?.amsNetId && (
                <p className="text-xs text-muted-foreground">
                  AMS: {ipcDevice.amsNetId}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <SiteStatusBadge status={site.status} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(site.id, site.name)}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              data-testid={`delete-card-site-${site.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-medium" data-testid={`text-uptime-${site.id}`}>
                {uptimePercentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Response Time</span>
              <span className="font-medium" data-testid={`text-response-time-${site.id}`}>
                {responseTime > 0 ? `${responseTime}ms` : "—"}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Device Status</span>
              <span className="font-medium capitalize" data-testid={`text-device-status-${site.id}`}>
                {ipcDevice?.status || "Unknown"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last Check</span>
              <span className="font-medium" data-testid={`text-last-check-${site.id}`}>
                {lastCheck ? formatDistanceToNow(lastCheck, { addSuffix: true }) : "Never"}
              </span>
            </div>
          </div>
        </div>
        
        {/* IPC Device Info */}
        {ipcDevice && (
          <div className="mt-3 pt-3 border-t">
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              {ipcDevice.lanIp && (
                <div className="flex items-center">
                  <Globe className="h-3 w-3 mr-1" />
                  <span>LAN: {ipcDevice.lanIp}</span>
                </div>
              )}
              {ipcDevice.vpnIp && (
                <div className="flex items-center">
                  <Activity className="h-3 w-3 mr-1" />
                  <span>VPN: {ipcDevice.vpnIp}</span>
                </div>
              )}
              {ipcDevice.anydesk && (
                <div className="col-span-2">
                  <span>AnyDesk: {ipcDevice.anydesk}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {lastOnline && site.status !== "online" && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>Last online {formatDistanceToNow(lastOnline, { addSuffix: true })}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Sites() {
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const { toast } = useToast();
  
  const { data: sites = [], isLoading: sitesLoading } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: ipcDevices = [] } = useQuery<IpcManagement[]>({
    queryKey: ["/api/ipc-management"],
    refetchInterval: 60000, // Refresh every minute
  });

  const deleteSiteMutation = useMutation({
    mutationFn: (siteId: string) => apiRequest("/api/sites/" + siteId, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Site deleted",
        description: "The monitoring site has been successfully removed.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to delete site",
        description: error.message || "An error occurred while deleting the site.",
      });
    },
  });

  const handleDeleteSite = (siteId: string, siteName: string) => {
    if (window.confirm(`Are you sure you want to delete "${siteName}"? This action cannot be undone.`)) {
      deleteSiteMutation.mutate(siteId);
    }
  };

  const onlineSites = sites.filter(site => site.status === "online").length;
  const totalSites = sites.length;
  const totalIPCDevices = ipcDevices.length;

  // Create a map of IP addresses to IPC devices for easy lookup
  const ipcByIP = ipcDevices.reduce((acc, ipc) => {
    if (ipc.vpnIp) acc[ipc.vpnIp] = ipc;
    if (ipc.lanIp) acc[ipc.lanIp] = ipc;
    return acc;
  }, {} as Record<string, IpcManagement>);

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Site Monitoring" 
        subtitle={`Monitor ${totalSites} sites • ${onlineSites} online • ${totalIPCDevices} IPC devices`}
      />
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">IPC Device Monitoring</h2>
            </div>
            <Badge variant="outline" data-testid="text-site-count">
              {totalSites} monitored sites from {totalIPCDevices} IPC devices
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex border rounded-lg p-1 bg-white">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                data-testid="button-card-view"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                data-testid="button-list-view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" asChild>
              <a href="/ipc-management" data-testid="link-ipc-management">
                <Plus className="h-4 w-4 mr-2" />
                Manage IPC
              </a>
            </Button>
            <SyncFromIPCButton />
          </div>
        </div>

        {sitesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sites.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No sites monitored</h3>
            <p className="mt-1 text-sm text-gray-500">
              {totalIPCDevices > 0 
                ? "Click 'Sync from IPC' to automatically create monitoring sites from your IPC management records."
                : "Add IPC devices first, then sync to start monitoring."
              }
            </p>
            <div className="mt-6 space-x-2">
              <Button variant="outline" asChild>
                <a href="/ipc-management">
                  <Plus className="h-4 w-4 mr-2" />
                  Add IPC Devices
                </a>
              </Button>
              {totalIPCDevices > 0 && <SyncFromIPCButton />}
            </div>
          </div>
        ) : (
          <div className={viewMode === 'cards' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-3"
          }>
            {sites.map((site) => (
              viewMode === 'cards' ? (
                <SiteCard 
                  key={site.id} 
                  site={site} 
                  ipcDevice={ipcByIP[site.ipAddress]}
                  onDelete={handleDeleteSite}
                  isDeleting={deleteSiteMutation.isPending}
                />
              ) : (
                <SiteListItem
                  key={site.id}
                  site={site}
                  ipcDevice={ipcByIP[site.ipAddress]}
                  onDelete={handleDeleteSite}
                  isDeleting={deleteSiteMutation.isPending}
                />
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}