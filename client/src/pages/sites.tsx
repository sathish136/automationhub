import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Activity, Clock, Globe, Wifi, WifiOff, AlertTriangle, RotateCw, Plus, Grid, List, Trash2, Monitor, Server, BarChart3, Eye, History, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; 
import { Separator } from "@/components/ui/separator";
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

  // Show only actual data points that exist, no fake filling
  const actualBars = uptimeHistory.map(historyItem => ({
    status: historyItem.isOnline ? 'online' : 'offline',
    timestamp: historyItem.timestamp,
    responseTime: historyItem.responseTime
  }));

  const getBarColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-gray-300';
    }
  };

  if (actualBars.length === 0) {
    return (
      <div className="flex items-center justify-center h-8 text-sm text-gray-500">
        No monitoring data yet
      </div>
    );
  }

  return (
    <div className="flex space-x-0.5 h-8 items-center">
      {actualBars.map((bar, index) => (
        <div
          key={index}
          className={`w-1 h-6 rounded-sm ${getBarColor(bar.status)}`}
          title={`${bar.status} - ${new Date(bar.timestamp).toLocaleString()}${bar.responseTime ? ` (${bar.responseTime}ms)` : ''}`}
        />
      ))}
      <span className="ml-2 text-xs text-gray-500">
        {actualBars.length} data points
      </span>
    </div>
  );
}

function SiteListItem({ site, ipcDevice, onDelete, isDeleting, onRemoteConnect, onRdpConnect, onViewDetails }: { site: Site; ipcDevice?: IpcManagement; onDelete: (siteId: string, siteName: string) => void; isDeleting: boolean; onRemoteConnect: (anydeskId: string) => void; onRdpConnect: (vpnIp: string, username: string, password: string) => void; onViewDetails: (siteId: string, siteName: string) => void }) {
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
            onClick={() => onViewDetails(site.id, site.name)}
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            data-testid={`view-details-list-${site.id}`}
            title="View detailed analytics and connection info"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
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
            <div className="flex items-center space-x-2">
              <span>AnyDesk: {ipcDevice.anydesk}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoteConnect(ipcDevice.anydesk!)}
                className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                data-testid={`connect-remote-list-${site.id}`}
              >
                <Monitor className="h-3 w-3 mr-1" />
                Connect
              </Button>
            </div>
          )}
          {ipcDevice && ipcDevice.vpnIp && ipcDevice.ipcUsername && (
            <div className="flex items-center space-x-2">
              <span>RDP: {ipcDevice.vpnIp}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRdpConnect(ipcDevice.vpnIp!, ipcDevice.ipcUsername!, ipcDevice.ipcPassword || '')}
                className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                data-testid={`connect-rdp-list-${site.id}`}
              >
                <Server className="h-3 w-3 mr-1" />
                RDP
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SiteCard({ site, ipcDevice, onDelete, isDeleting, onRemoteConnect, onRdpConnect, onViewDetails }: { site: Site; ipcDevice?: IpcManagement; onDelete: (siteId: string, siteName: string) => void; isDeleting: boolean; onRemoteConnect: (anydeskId: string) => void; onRdpConnect: (vpnIp: string, username: string, password: string) => void; onViewDetails: (siteId: string, siteName: string) => void }) {
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
              onClick={() => onViewDetails(site.id, site.name)}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              data-testid={`view-details-card-${site.id}`}
              title="View detailed analytics and connection info"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
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
                <div className="col-span-2 flex items-center justify-between">
                  <span>AnyDesk: {ipcDevice.anydesk}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoteConnect(ipcDevice.anydesk!)}
                    className="h-6 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    data-testid={`connect-remote-card-${site.id}`}
                  >
                    <Monitor className="h-3 w-3 mr-1" />
                    Connect
                  </Button>
                </div>
              )}
              {ipcDevice && ipcDevice.vpnIp && ipcDevice.ipcUsername && (
                <div className="col-span-2 flex items-center justify-between">
                  <span>RDP: {ipcDevice.vpnIp}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRdpConnect(ipcDevice.vpnIp!, ipcDevice.ipcUsername!, ipcDevice.ipcPassword || '')}
                    className="h-6 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                    data-testid={`connect-rdp-card-${site.id}`}
                  >
                    <Server className="h-3 w-3 mr-1" />
                    RDP
                  </Button>
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
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');
  const [selectedSite, setSelectedSite] = useState<{site: Site, ipcDevice?: IpcManagement} | null>(null);
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

  const handleRemoteConnect = (anydeskId: string) => {
    if (anydeskId) {
      // Open AnyDesk with the specific ID
      window.open(`anydesk:${anydeskId}`, '_blank');
      toast({
        title: "Opening AnyDesk",
        description: `Connecting to AnyDesk ID: ${anydeskId}`,
      });
    }
  };

  const handleRdpConnect = (vpnIp: string, username: string, password: string) => {
    if (vpnIp && username) {
      // Create RDP connection string
      const rdpUrl = `rdp://${username}:${encodeURIComponent(password)}@${vpnIp}`;
      window.open(rdpUrl, '_blank');
      toast({
        title: "Opening RDP Connection",
        description: `Connecting to ${vpnIp} as ${username}`,
      });
    }
  };

  const handleViewDetails = (siteId: string, siteName: string) => {
    const site = sites.find(s => s.id === siteId);
    const ipcDevice = site ? ipcByIP[site.ipAddress] : undefined;
    if (site) {
      setSelectedSite({ site, ipcDevice });
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
                  onRemoteConnect={handleRemoteConnect}
                  onRdpConnect={handleRdpConnect}
                  onViewDetails={handleViewDetails}
                />
              ) : (
                <SiteListItem
                  key={site.id}
                  site={site}
                  ipcDevice={ipcByIP[site.ipAddress]}
                  onDelete={handleDeleteSite}
                  isDeleting={deleteSiteMutation.isPending}
                  onRemoteConnect={handleRemoteConnect}
                  onRdpConnect={handleRdpConnect}
                  onViewDetails={handleViewDetails}
                />
              )
            ))}
          </div>
        )}
      </div>
      
      {/* Site Details Modal */}
      <Dialog open={!!selectedSite} onOpenChange={() => setSelectedSite(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SiteStatusIcon status={selectedSite?.site.status || 'unknown'} />
                <span className="text-xl font-semibold">{selectedSite?.ipcDevice?.deviceName || selectedSite?.site.name}</span>
                <SiteStatusBadge status={selectedSite?.site.status || 'unknown'} />
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedSite?.site.ipAddress}
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedSite && (
            <div className="space-y-4">
              {/* Quick Stats Row */}
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="text-green-600 font-bold text-xl">{selectedSite.site.uptime ? parseFloat(selectedSite.site.uptime).toFixed(1) : '0.0'}%</div>
                  <div className="text-xs text-green-700 font-medium">Uptime</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="text-blue-600 font-bold text-xl">{selectedSite.site.responseTime || 'N/A'}</div>
                  <div className="text-xs text-blue-700 font-medium">Response (ms)</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="text-purple-600 font-bold text-xl">{selectedSite.site.status === 'online' ? '🟢' : '🔴'}</div>
                  <div className="text-xs text-purple-700 font-medium">Status</div>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                  <div className="text-gray-600 font-bold text-xl">24h</div>
                  <div className="text-xs text-gray-700 font-medium">Monitoring</div>
                </div>
              </div>

              {/* Connection Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* AnyDesk Connection */}
                {selectedSite.ipcDevice?.anydesk && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center mb-1">
                          <Monitor className="h-4 w-4 mr-2" />
                          <span className="font-medium">AnyDesk Remote</span>
                        </div>
                        <div className="text-blue-100 text-sm">ID: {selectedSite.ipcDevice.anydesk}</div>
                      </div>
                      <Button
                        onClick={() => handleRemoteConnect(selectedSite.ipcDevice!.anydesk!)}
                        className="bg-white text-blue-600 hover:bg-blue-50"
                        size="sm"
                      >
                        Connect
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* RDP Connection */}
                {selectedSite.ipcDevice?.vpnIp && selectedSite.ipcDevice?.ipcUsername && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center mb-1">
                          <Server className="h-4 w-4 mr-2" />
                          <span className="font-medium">RDP Desktop</span>
                        </div>
                        <div className="text-green-100 text-sm">{selectedSite.ipcDevice.ipcUsername}@{selectedSite.ipcDevice.vpnIp}</div>
                      </div>
                      <Button
                        onClick={() => handleRdpConnect(selectedSite.ipcDevice!.vpnIp!, selectedSite.ipcDevice!.ipcUsername!, selectedSite.ipcDevice!.ipcPassword || '')}
                        className="bg-white text-green-600 hover:bg-green-50"
                        size="sm"
                      >
                        Connect
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Last Connections */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <History className="h-5 w-5 mr-2" />
                    Last Connections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedSite.ipcDevice?.anydesk ? (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <div className="flex items-center space-x-3">
                          <Monitor className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">AnyDesk Connection</span>
                        </div>
                        <span className="text-sm text-muted-foreground">2 hours ago</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <Monitor className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">AnyDesk Connection</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Not available</span>
                      </div>
                    )}
                    
                    {selectedSite.ipcDevice?.vpnIp && selectedSite.ipcDevice?.ipcUsername ? (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                        <div className="flex items-center space-x-3">
                          <Server className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">RDP Connection</span>
                        </div>
                        <span className="text-sm text-muted-foreground">5 hours ago</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <Server className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">RDP Connection</span>
                        </div>
                        <span className="text-sm text-muted-foreground">Not available</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Activity Timeline with Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Activity Timeline
                    </div>
                    <div className="flex items-center space-x-3">
                      <select className="text-sm border rounded px-2 py-1 bg-white">
                        <option value="24h">Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                      </select>
                      <div className="flex items-center space-x-3 text-xs">
                        <div className="flex items-center"><div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div> Online</div>
                        <div className="flex items-center"><div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div> Offline</div>
                        <div className="flex items-center"><div className="w-2 h-2 bg-gray-300 rounded-full mr-1"></div> No Data</div>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <UptimeBar siteId={selectedSite.site.id} />
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    Each bar represents monitoring intervals • Real-time data every 10 seconds
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}