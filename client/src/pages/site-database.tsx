import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Plus, 
  Database,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Activity,
  Gauge
} from "lucide-react";
import { insertSiteDatabaseTagSchema } from "@shared/schema";
import type { 
  Site, 
  SiteDatabaseTag, 
  SiteDatabaseValue
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
  const { data: latestValues = [] } = useQuery({
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
        return <Database className="h-4 w-4" />;
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
      </div>

      {/* Site Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedSite} onValueChange={setSelectedSite} data-testid="select-site">
                <SelectTrigger>
                  <SelectValue placeholder="Select a site..." />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name} ({site.ipAddress})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSite && (
              <div className="flex items-center gap-2">
                {sites.find(s => s.id === selectedSite)?.status === 'online' ? (
                  <Badge className="bg-green-500">Online</Badge>
                ) : (
                  <Badge variant="destructive">Offline</Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ADS Tags Section */}
      {selectedSite && (
        <Card>
          <CardHeader className="pb-4">
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
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Tag Name</TableHead>
                      <TableHead className="font-semibold">ADS Path</TableHead>
                      <TableHead className="font-semibold">Data Type</TableHead>
                      <TableHead className="font-semibold">Current Value</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tags.map((tag, index) => {
                      const latestValue = latestValues.find(v => v.tagId === tag.id);
                      return (
                        <TableRow key={tag.id} data-testid={`tag-row-${tag.id}`} className={index % 2 === 0 ? "bg-muted/25" : ""}>
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
                          <TableCell className="font-mono font-semibold text-blue-600">
                            {latestValue ? latestValue.value : "-"}
                          </TableCell>
                          <TableCell>
                            {tag.isActive ? (
                              <Badge className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditTag(tag)}
                                data-testid={`button-edit-${tag.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTag(tag.id)}
                                data-testid={`button-delete-${tag.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
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
                      <Input placeholder="e.g., GVL.Temperature" {...field} data-testid="input-ads-path" />
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
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange} data-testid="select-data-type">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BOOL">BOOL</SelectItem>
                          <SelectItem value="INT">INT</SelectItem>
                          <SelectItem value="DINT">DINT</SelectItem>
                          <SelectItem value="REAL">REAL</SelectItem>
                          <SelectItem value="STRING">STRING</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
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