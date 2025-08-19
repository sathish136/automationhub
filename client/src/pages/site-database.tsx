import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Activity, 
  Plus, 
  Settings, 
  Database,
  Signal,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Monitor,
  Gauge
} from "lucide-react";
import { insertSiteDatabaseTagSchema } from "@shared/schema";
import type { 
  Site, 
  SiteDatabaseTag, 
  SiteDatabaseValue,
  MbrRealtimeData,
  RoRealtimeData
} from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";

const tagFormSchema = insertSiteDatabaseTagSchema;

// Utility functions
const formatTimestamp = (timestamp: string | Date) => {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  return format(date, "MMM dd, yyyy HH:mm:ss");
};

type TagFormValues = z.infer<typeof tagFormSchema>;

export default function SiteDatabase() {
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<SiteDatabaseTag | null>(null);
  const queryClient = useQueryClient();

  // Fetch sites
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
  });

  // Fetch tags for selected site
  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ["/api/site-database-tags", selectedSite],
    queryFn: async () => {
      const response = await fetch(`/api/site-database-tags?siteId=${selectedSite}`);
      return response.json() as Promise<SiteDatabaseTag[]>;
    },
    enabled: !!selectedSite,
  });

  // Fetch latest values for selected site
  const { data: latestValues = [], refetch: refetchValues } = useQuery({
    queryKey: ["/api/sites", selectedSite, "database-values", "latest"],
    queryFn: async () => {
      const response = await fetch(`/api/sites/${selectedSite}/database-values/latest`);
      return response.json() as Promise<Array<SiteDatabaseValue & { tag: SiteDatabaseTag }>>;
    },
    enabled: !!selectedSite,
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Tag form
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      siteId: "",
      tagName: "",
      adsPath: "",
      dataType: "INT",
      description: "",
      scanInterval: 2000,
      isActive: true,
    },
  });

  // Create/Update tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (data: TagFormValues) => {
      if (editingTag) {
        return apiRequest(`/api/site-database-tags/${editingTag.id}`, "PUT", data);
      }
      return apiRequest("/api/site-database-tags", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-database-tags"] });
      setIsTagDialogOpen(false);
      setEditingTag(null);
      form.reset();
      toast({
        title: editingTag ? "Tag updated" : "Tag created",
        description: `ADS tag has been ${editingTag ? "updated" : "created"} successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editingTag ? "update" : "create"} tag: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) =>
      apiRequest(`/api/site-database-tags/${tagId}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-database-tags"] });
      toast({
        title: "Tag deleted",
        description: "ADS tag has been deleted successfully.",
      });
    },
  });

  const onSubmit = (data: TagFormValues) => {
    createTagMutation.mutate({ ...data, siteId: selectedSite });
  };

  const handleEditTag = (tag: SiteDatabaseTag) => {
    setEditingTag(tag);
    form.reset({
      siteId: tag.siteId,
      tagName: tag.tagName,
      adsPath: tag.adsPath,
      dataType: tag.dataType,
      description: tag.description || "",
      scanInterval: tag.scanInterval || 2000,
      isActive: tag.isActive,
    });
    setIsTagDialogOpen(true);
  };

  const handleDeleteTag = (tagId: string) => {
    if (confirm("Are you sure you want to delete this tag?")) {
      deleteTagMutation.mutate(tagId);
    }
  };

  const handleAddTag = () => {
    setEditingTag(null);
    form.reset({
      siteId: selectedSite,
      tagName: "",
      adsPath: "",
      dataType: "INT",
      description: "",
      scanInterval: 2000,
      isActive: true,
    });
    setIsTagDialogOpen(true);
  };

  const getDataTypeIcon = (dataType: string) => {
    switch (dataType.toUpperCase()) {
      case 'BOOL':
        return <CheckCircle className="h-4 w-4" />;
      case 'INT':
      case 'DINT':
        return <Gauge className="h-4 w-4" />;
      case 'REAL':
        return <Activity className="h-4 w-4" />;
      case 'STRING':
        return <Database className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case 'GOOD':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Good</Badge>;
      case 'BAD':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Bad</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };



  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="site-database-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Site Database</h1>
          <p className="text-muted-foreground" data-testid="page-description">
            Manage ADS tags and monitor real-time data collection from industrial sites
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Signal className="h-5 w-5 text-green-500" />
          <span className="text-sm text-muted-foreground">ADS Monitoring Active</span>
        </div>
      </div>

      {/* Site Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Site Selection
          </CardTitle>
          <CardDescription>
            Select a site to configure ADS tags and view real-time data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site-select">Site</Label>
              <Select value={selectedSite} onValueChange={setSelectedSite} data-testid="site-select">
                <SelectTrigger>
                  <SelectValue placeholder="Select a site" />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id} data-testid={`site-option-${site.id}`}>
                      {site.name} ({site.ipAddress})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSite && (
              <div className="space-y-2">
                <Label>Site Status</Label>
                <div className="flex items-center gap-2">
                  {sites.find(s => s.id === selectedSite)?.status === 'online' ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Online</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">Offline</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedSite && (
        <Tabs defaultValue="tags" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tags" data-testid="tab-tags">ADS Tags</TabsTrigger>
            <TabsTrigger value="data" data-testid="tab-data">ADS Data</TabsTrigger>
            <TabsTrigger value="mbr" data-testid="tab-mbr">MBR Data</TabsTrigger>
            <TabsTrigger value="ro" data-testid="tab-ro">RO Data</TabsTrigger>
          </TabsList>

          <TabsContent value="tags" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      ADS Tags Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure ADS tags for real-time data collection
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddTag} data-testid="button-add-tag">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tag
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tagsLoading ? (
                  <div className="text-center py-8">Loading tags...</div>
                ) : tags.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No ADS tags configured for this site
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tag Name</TableHead>
                        <TableHead>ADS Path</TableHead>
                        <TableHead>Data Type</TableHead>
                        <TableHead>Scan Interval</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tags.map((tag) => (
                        <TableRow key={tag.id} data-testid={`tag-row-${tag.id}`}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getDataTypeIcon(tag.dataType)}
                              {tag.tagName}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{tag.adsPath}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{tag.dataType}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {(tag.scanInterval || 2000) / 1000}s
                            </div>
                          </TableCell>
                          <TableCell>
                            {tag.isActive ? (
                              <Badge variant="default" className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditTag(tag)}
                                data-testid={`button-edit-${tag.id}`}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteTag(tag.id)}
                                data-testid={`button-delete-${tag.id}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  ADS Real-time Data
                </CardTitle>
                <CardDescription>
                  Live data values from ADS tags (updates every 3 seconds)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {latestValues.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No data available. Configure ADS tags first.
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Tag Name</TableHead>
                          <TableHead className="font-semibold">ADS Path</TableHead>
                          <TableHead className="font-semibold">Value</TableHead>
                          <TableHead className="font-semibold">Quality</TableHead>
                          <TableHead className="font-semibold">Last Update</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {latestValues.map((item, index) => (
                          <TableRow key={item.id} data-testid={`data-row-${item.tagId}`} className={index % 2 === 0 ? "bg-muted/25" : ""}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {getDataTypeIcon(item.tag.dataType)}
                                {item.tag.tagName}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{item.tag.adsPath}</TableCell>
                            <TableCell className="font-mono font-semibold text-blue-600">{item.value}</TableCell>
                            <TableCell>{getQualityBadge(item.quality)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.timestamp ? formatTimestamp(item.timestamp) : "Never"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <MbrDataTab selectedSite={selectedSite} />
          <RoDataTab selectedSite={selectedSite} />
        </Tabs>
      )}

      {/* Add/Edit Tag Dialog */}
      <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
        <DialogContent className="max-w-md" data-testid="tag-dialog">
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit ADS Tag" : "Add ADS Tag"}</DialogTitle>
            <DialogDescription>
              {editingTag ? "Update the ADS tag configuration" : "Configure a new ADS tag for data collection"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tagName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Temperature_01" {...field} data-testid="input-tag-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="adsPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ADS Path</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main.PlcTask.GVL.Temperature" {...field} data-testid="input-ads-path" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} data-testid="select-data-type">
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select data type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BOOL">BOOL</SelectItem>
                        <SelectItem value="INT">INT</SelectItem>
                        <SelectItem value="DINT">DINT</SelectItem>
                        <SelectItem value="REAL">REAL</SelectItem>
                        <SelectItem value="STRING">STRING</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scanInterval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scan Interval (ms)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1000" 
                        step="500"
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 2000)}
                        data-testid="input-scan-interval"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tag description..."
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Enable Tag</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Start monitoring this tag immediately
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-is-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsTagDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTagMutation.isPending} data-testid="button-save-tag">
                  {createTagMutation.isPending ? "Saving..." : (editingTag ? "Update" : "Create")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// MBR Data Tab Component
function MbrDataTab({ selectedSite }: { selectedSite: string }) {
  // Fetch latest MBR data
  const { data: mbrData, isLoading: mbrLoading } = useQuery<MbrRealtimeData>({
    queryKey: ["/api/sites", selectedSite, "mbr-realtime-data", "latest"],
    queryFn: async () => {
      const response = await fetch(`/api/sites/${selectedSite}/mbr-realtime-data/latest`);
      return response.json() as Promise<MbrRealtimeData>;
    },
    enabled: !!selectedSite,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const formatValue = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "-";
    return Number(value).toFixed(2);
  };

  return (
    <TabsContent value="mbr" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-blue-500" />
            MBR Real-time Data
          </CardTitle>
          <CardDescription>
            Live MBR (Membrane Bio-Reactor) system data (updates every 5 seconds)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mbrLoading ? (
            <div className="text-center py-8">Loading MBR data...</div>
          ) : !mbrData ? (
            <div className="text-center py-8 text-muted-foreground">
              No MBR data available for this site
            </div>
          ) : (
            <div className="space-y-6">
              {/* MBR System Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Temperature</p>
                        <p className="text-2xl font-bold text-blue-600">{formatValue(mbrData.mbrTmp)}°C</p>
                      </div>
                      <Activity className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Flow Rate</p>
                        <p className="text-2xl font-bold text-green-600">{formatValue(mbrData.mbrFlow)} L/h</p>
                      </div>
                      <Gauge className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tank Level</p>
                        <p className="text-2xl font-bold text-purple-600">{formatValue(mbrData.mbrTankLevel)}%</p>
                      </div>
                      <Database className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed MBR Data Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Detailed Parameters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Parameter</TableHead>
                          <TableHead className="font-semibold">Value</TableHead>
                          <TableHead className="font-semibold">Unit</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="bg-muted/25">
                          <TableCell className="font-medium">MBR pH</TableCell>
                          <TableCell className="font-mono text-blue-600">{formatValue(mbrData.mbrPh)}</TableCell>
                          <TableCell>pH</TableCell>
                          <TableCell>{mbrData.mbrRf ? <Badge className="bg-green-500">Running</Badge> : <Badge variant="secondary">Stopped</Badge>}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">CTS pH</TableCell>
                          <TableCell className="font-mono text-blue-600">{formatValue(mbrData.ctsPh)}</TableCell>
                          <TableCell>pH</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/25">
                          <TableCell className="font-medium">Turbidity</TableCell>
                          <TableCell className="font-mono text-blue-600">{formatValue(mbrData.turbidity)}</TableCell>
                          <TableCell>NTU</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Pressure (PT)</TableCell>
                          <TableCell className="font-mono text-blue-600">{formatValue(mbrData.mbrPt)}</TableCell>
                          <TableCell>bar</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/25">
                          <TableCell className="font-medium">Permeate</TableCell>
                          <TableCell className="font-mono text-blue-600">{formatValue(mbrData.mbrPermeate)}</TableCell>
                          <TableCell>L</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Energy Consumption</TableCell>
                          <TableCell className="font-mono text-blue-600">{formatValue(mbrData.energy)}</TableCell>
                          <TableCell>kWh</TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/25">
                          <TableCell className="font-medium">H2SO4 Dosing</TableCell>
                          <TableCell className="font-mono text-blue-600">{formatValue(mbrData.h2so4)}</TableCell>
                          <TableCell>L</TableCell>
                          <TableCell>{mbrData.h2so4Rf ? <Badge className="bg-green-500">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Last updated: {mbrData.timestamp ? formatTimestamp(mbrData.timestamp) : "Never"}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

// RO Data Tab Component
function RoDataTab({ selectedSite }: { selectedSite: string }) {
  // Fetch latest RO data
  const { data: roData, isLoading: roLoading } = useQuery<RoRealtimeData>({
    queryKey: ["/api/sites", selectedSite, "ro-realtime-data", "latest"],
    queryFn: async () => {
      const response = await fetch(`/api/sites/${selectedSite}/ro-realtime-data/latest`);
      return response.json() as Promise<RoRealtimeData>;
    },
    enabled: !!selectedSite,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const formatValue = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "-";
    return Number(value).toFixed(2);
  };

  return (
    <TabsContent value="ro" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-orange-500" />
            RO Real-time Data
          </CardTitle>
          <CardDescription>
            Live RO (Reverse Osmosis) system data (updates every 5 seconds)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roLoading ? (
            <div className="text-center py-8">Loading RO data...</div>
          ) : !roData ? (
            <div className="text-center py-8 text-muted-foreground">
              No RO data available for this site
            </div>
          ) : (
            <div className="space-y-6">
              {/* RO System Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Feed Flow</p>
                        <p className="text-2xl font-bold text-orange-600">{formatValue(roData.feedFlow)} L/h</p>
                      </div>
                      <Activity className="h-8 w-8 text-orange-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Recovery</p>
                        <p className="text-2xl font-bold text-green-600">{formatValue(roData.roRecovery)}%</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Feed pH</p>
                        <p className="text-2xl font-bold text-blue-600">{formatValue(roData.roFeedPh)}</p>
                      </div>
                      <Gauge className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Feed Level</p>
                        <p className="text-2xl font-bold text-purple-600">{formatValue(roData.roFeedLt)}%</p>
                      </div>
                      <Database className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* RO Stages Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-600">Stage 1 Parameters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-blue-50">
                            <TableHead className="font-semibold">Parameter</TableHead>
                            <TableHead className="font-semibold">Value</TableHead>
                            <TableHead className="font-semibold">Unit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="bg-muted/25">
                            <TableCell className="font-medium">Permeate</TableCell>
                            <TableCell className="font-mono text-blue-600">{formatValue(roData.stg1Per)}</TableCell>
                            <TableCell>L/h</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Recovery</TableCell>
                            <TableCell className="font-mono text-blue-600">{formatValue(roData.stg1Recovery)}</TableCell>
                            <TableCell>%</TableCell>
                          </TableRow>
                          <TableRow className="bg-muted/25">
                            <TableCell className="font-medium">Inlet Pressure</TableCell>
                            <TableCell className="font-mono text-blue-600">{formatValue(roData.stg1InPt)}</TableCell>
                            <TableCell>bar</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Outlet Pressure</TableCell>
                            <TableCell className="font-mono text-blue-600">{formatValue(roData.stg1OutPt)}</TableCell>
                            <TableCell>bar</TableCell>
                          </TableRow>
                          <TableRow className="bg-muted/25">
                            <TableCell className="font-medium">Pressure Drop</TableCell>
                            <TableCell className="font-mono text-blue-600">{formatValue(roData.stg1Dp)}</TableCell>
                            <TableCell>bar</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-green-600">Stage 2 Parameters</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-green-50">
                            <TableHead className="font-semibold">Parameter</TableHead>
                            <TableHead className="font-semibold">Value</TableHead>
                            <TableHead className="font-semibold">Unit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="bg-muted/25">
                            <TableCell className="font-medium">Permeate</TableCell>
                            <TableCell className="font-mono text-green-600">{formatValue(roData.stg2Per)}</TableCell>
                            <TableCell>L/h</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Recovery</TableCell>
                            <TableCell className="font-mono text-green-600">{formatValue(roData.stg2Recovery)}</TableCell>
                            <TableCell>%</TableCell>
                          </TableRow>
                          <TableRow className="bg-muted/25">
                            <TableCell className="font-medium">Inlet Pressure</TableCell>
                            <TableCell className="font-mono text-green-600">{formatValue(roData.stg2InPt)}</TableCell>
                            <TableCell>bar</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Outlet Pressure</TableCell>
                            <TableCell className="font-mono text-green-600">{formatValue(roData.stg2OutPt)}</TableCell>
                            <TableCell>bar</TableCell>
                          </TableRow>
                          <TableRow className="bg-muted/25">
                            <TableCell className="font-medium">Pressure Drop</TableCell>
                            <TableCell className="font-mono text-green-600">{formatValue(roData.stg2Dp)}</TableCell>
                            <TableCell>bar</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-sm text-muted-foreground text-center">
                Last updated: {roData.timestamp ? formatTimestamp(roData.timestamp) : "Never"}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}