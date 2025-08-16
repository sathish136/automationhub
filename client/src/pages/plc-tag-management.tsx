import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Download, Plus, Trash2, AlertTriangle, CheckCircle, Activity, Settings } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PlcTag {
  id: string;
  siteId: string;
  tagName: string;
  plcAddress: string;
  description: string;
  dataType: string;
  isActive: boolean;
  alarmOnTrue: boolean;
  alarmOnFalse: boolean;
  severityLevel: string;
  lastValue: string | null;
  lastReadTime: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Site {
  id: string;
  name: string;
  ipAddress: string;
  status: string;
}

export default function PlcTagManagement() {
  const [selectedSite, setSelectedSite] = useState("");
  const [bulkUploadText, setBulkUploadText] = useState("");
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const { toast } = useToast();

  // Fetch sites
  const { data: sites } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
  });

  // Fetch PLC tags
  const { data: plcTags, isLoading } = useQuery<PlcTag[]>({
    queryKey: ["/api/plc-tags"],
  });

  // Bulk upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async (data: { siteId: string; tags: any[] }) => {
      return apiRequest("/api/plc-tags/bulk", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plc-tags"] });
      setBulkUploadText("");
      setShowBulkUpload(false);
      toast({
        title: "Success",
        description: "PLC tags uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload PLC tags",
        variant: "destructive",
      });
    },
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      return apiRequest(`/api/plc-tags/${tagId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plc-tags"] });
      toast({
        title: "Success",
        description: "PLC tag deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete PLC tag",
        variant: "destructive",
      });
    },
  });

  const handleBulkUpload = () => {
    if (!selectedSite || !bulkUploadText.trim()) {
      toast({
        title: "Error",
        description: "Please select a site and provide tag data",
        variant: "destructive",
      });
      return;
    }

    try {
      const lines = bulkUploadText.trim().split('\n');
      const tags = lines.map(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 4) {
          throw new Error(`Invalid line format: ${line}`);
        }
        return {
          tagName: parts[0],
          plcAddress: parts[1],
          description: parts[2],
          dataType: parts[3] || 'BOOL',
          alarmOnTrue: (parts[4] || 'true').toLowerCase() === 'true',
          severityLevel: parts[5] || 'warning'
        };
      });

      bulkUploadMutation.mutate({ siteId: selectedSite, tags });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid CSV format",
        variant: "destructive",
      });
    }
  };

  const getSiteName = (siteId: string) => {
    const site = sites?.find(s => s.id === siteId);
    return site ? site.name : "Unknown Site";
  };

  const getTagIcon = (dataType: string, alarmOnTrue: boolean) => {
    if (alarmOnTrue) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
    if (dataType === 'BOOL') {
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    }
    if (dataType === 'REAL' || dataType === 'INT') {
      return <Activity className="h-4 w-4 text-green-500" />;
    }
    return <Settings className="h-4 w-4 text-gray-500" />;
  };

  const filteredTags = selectedSite && selectedSite !== "all"
    ? plcTags?.filter(tag => tag.siteId === selectedSite) 
    : plcTags;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">PLC Tag Management</h1>
          <p className="text-sm text-gray-500">Configure PLC tags for site monitoring and alerts</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setShowBulkUpload(!showBulkUpload)}
            className="flex items-center gap-2"
            data-testid="button-bulk-upload"
          >
            <Upload className="h-4 w-4" />
            Bulk Upload
          </Button>
        </div>
      </div>

      {/* Site Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="site-select">Filter by Site:</Label>
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-64" data-testid="select-site-filter">
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {sites?.map(site => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filteredTags && (
              <Badge variant="outline" className="ml-2">
                {filteredTags.length} tags
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Upload Section */}
      {showBulkUpload && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Upload PLC Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="site-upload">Select Site for Upload:</Label>
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger className="w-full mt-1" data-testid="select-site-upload">
                  <SelectValue placeholder="Choose a site..." />
                </SelectTrigger>
                <SelectContent>
                  {sites?.map(site => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="bulk-data">CSV Data (tagName, plcAddress, description, dataType, alarmOnTrue, severityLevel):</Label>
              <Textarea
                id="bulk-data"
                placeholder={`Example format:
CTS Feed Pump 1 Trip, GVL.M_CTS_FEED_PUMP1_TRIP, CTS Feed Pump 1 Trip Alarm, BOOL, true, critical
CTS Feed Pump 2 Trip, GVL.M_CTS_FEED_PUMP2_TRIP, CTS Feed Pump 2 Trip Alarm, BOOL, true, critical
Flow Rate Inlet, GVL.FLOW_RATE_INLET, Inlet Flow Rate, REAL, false, info`}
                value={bulkUploadText}
                onChange={(e) => setBulkUploadText(e.target.value)}
                className="mt-1 min-h-32"
                data-testid="textarea-bulk-upload"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleBulkUpload}
                disabled={bulkUploadMutation.isPending || !selectedSite || !bulkUploadText.trim()}
                className="flex items-center gap-2"
                data-testid="button-confirm-upload"
              >
                <Upload className="h-4 w-4" />
                {bulkUploadMutation.isPending ? "Uploading..." : "Upload Tags"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowBulkUpload(false)}
                data-testid="button-cancel-upload"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PLC Tags List */}
      <Card>
        <CardHeader>
          <CardTitle>PLC Tags</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredTags && filteredTags.length > 0 ? (
            <div className="space-y-3">
              {filteredTags.map((tag) => (
                <div key={tag.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`tag-row-${tag.id}`}>
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700">
                      {getTagIcon(tag.dataType, tag.alarmOnTrue)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {tag.tagName}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {tag.dataType}
                        </Badge>
                        {tag.alarmOnTrue && (
                          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                            Alarm
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {tag.severityLevel}
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {tag.description}
                      </p>
                      
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="font-mono">{tag.plcAddress}</span>
                        <span>Site: {getSiteName(tag.siteId)}</span>
                        {tag.lastValue && (
                          <span>Last: {tag.lastValue}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={tag.isActive ? "default" : "secondary"} className="text-xs">
                      {tag.isActive ? "Active" : "Inactive"}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTagMutation.mutate(tag.id)}
                      disabled={deleteTagMutation.isPending}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      data-testid={`button-delete-${tag.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No PLC tags configured</p>
              <p className="text-sm">Use bulk upload to add tags for your sites</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}