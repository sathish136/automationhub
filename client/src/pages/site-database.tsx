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
  SiteDatabaseValue 
} from "@shared/schema";
import { z } from "zod";

const tagFormSchema = insertSiteDatabaseTagSchema;

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
      const response = await apiRequest(`/api/site-database-tags?siteId=${selectedSite}`, { method: "GET" });
      return response as SiteDatabaseTag[];
    },
    enabled: !!selectedSite,
  });

  // Fetch latest values for selected site
  const { data: latestValues = [], refetch: refetchValues } = useQuery({
    queryKey: ["/api/sites", selectedSite, "database-values", "latest"],
    queryFn: async () => {
      const response = await apiRequest(`/api/sites/${selectedSite}/database-values/latest`, { method: "GET" });
      return response as Array<SiteDatabaseValue & { tag: SiteDatabaseTag }>;
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
        return apiRequest(`/api/site-database-tags/${editingTag.id}`, {
          method: "PUT",
          body: data,
        });
      }
      return apiRequest("/api/site-database-tags", {
        method: "POST",
        body: data,
      });
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
      apiRequest(`/api/site-database-tags/${tagId}`, { method: "DELETE" }),
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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
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
          <TabsList>
            <TabsTrigger value="tags" data-testid="tab-tags">ADS Tags</TabsTrigger>
            <TabsTrigger value="data" data-testid="tab-data">Real-time Data</TabsTrigger>
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
                  Real-time Data
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tag Name</TableHead>
                        <TableHead>ADS Path</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Quality</TableHead>
                        <TableHead>Last Update</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {latestValues.map((item) => (
                        <TableRow key={item.id} data-testid={`data-row-${item.tagId}`}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {getDataTypeIcon(item.tag.dataType)}
                              {item.tag.tagName}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{item.tag.adsPath}</TableCell>
                          <TableCell className="font-mono font-semibold">{item.value}</TableCell>
                          <TableCell>{getQualityBadge(item.quality)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatTimestamp(item.timestamp)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
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
                        {...field} 
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