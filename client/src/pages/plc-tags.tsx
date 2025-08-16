import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Edit, Activity, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPlcTagSchema, type PlcTag, type InsertPlcTag } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function PlcTagsPage() {
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<PlcTag | null>(null);
  const { toast } = useToast();

  // Fetch sites for selection
  const { data: sites = [] } = useQuery<any[]>({
    queryKey: ["/api/sites"],
  });

  // Fetch PLC tags for selected site
  const { data: plcTags = [], isLoading } = useQuery({
    queryKey: ["/api/plc-tags", selectedSiteId],
    queryFn: () => fetch(`/api/plc-tags${selectedSiteId ? `?siteId=${selectedSiteId}` : ""}`).then(res => res.json()),
  });

  // Create/Update PLC tag mutation
  const createTagMutation = useMutation({
    mutationFn: async (data: InsertPlcTag) => {
      const response = await fetch("/api/plc-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create PLC tag");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plc-tags"] });
      setIsDialogOpen(false);
      setEditingTag(null);
      toast({ title: "PLC tag created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create PLC tag", variant: "destructive" });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPlcTag> }) => {
      const response = await fetch(`/api/plc-tags/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update PLC tag");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plc-tags"] });
      setIsDialogOpen(false);
      setEditingTag(null);
      toast({ title: "PLC tag updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update PLC tag", variant: "destructive" });
    },
  });

  // Delete PLC tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/plc-tags/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete PLC tag");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plc-tags"] });
      toast({ title: "PLC tag deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete PLC tag", variant: "destructive" });
    },
  });

  const form = useForm<InsertPlcTag>({
    resolver: zodResolver(insertPlcTagSchema),
    defaultValues: {
      siteId: selectedSiteId,
      tagName: "",
      plcAddress: "",
      description: "",
      dataType: "BOOL",
      isActive: true,
      alarmOnTrue: true,
      alarmOnFalse: false,
      severityLevel: "warning",
    },
  });

  const onSubmit = (data: InsertPlcTag) => {
    if (editingTag) {
      updateTagMutation.mutate({ id: editingTag.id, data });
    } else {
      createTagMutation.mutate(data);
    }
  };

  const handleEdit = (tag: PlcTag) => {
    setEditingTag(tag);
    form.reset({
      siteId: tag.siteId,
      tagName: tag.tagName,
      plcAddress: tag.plcAddress,
      description: tag.description ?? "",
      dataType: tag.dataType,
      isActive: tag.isActive ?? true,
      alarmOnTrue: tag.alarmOnTrue ?? false,
      alarmOnFalse: tag.alarmOnFalse ?? false,
      severityLevel: tag.severityLevel ?? "warning",
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingTag(null);
    form.reset({
      siteId: selectedSiteId,
      tagName: "",
      plcAddress: "",
      description: "",
      dataType: "BOOL",
      isActive: true,
      alarmOnTrue: true,
      alarmOnFalse: false,
      severityLevel: "warning",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">PLC Tag Monitoring</h1>
          <p className="text-muted-foreground">Configure and monitor Beckhoff PLC tags for real-time alerts</p>
        </div>
        <Button onClick={handleNew} disabled={!selectedSiteId}>
          <Plus className="w-4 h-4 mr-2" />
          Add PLC Tag
        </Button>
      </div>

      {/* Site Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Site Selection</CardTitle>
          <CardDescription>Select a site to manage its PLC tags</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full max-w-md">
            <Label htmlFor="site-select">Site</Label>
            <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
              <SelectTrigger id="site-select">
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site: any) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name} ({site.location})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* PLC Tags List */}
      {selectedSiteId && (
        <Card>
          <CardHeader>
            <CardTitle>PLC Tags</CardTitle>
            <CardDescription>
              Configured PLC tags for monitoring. Tags with alarms enabled will create alerts when values change.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading PLC tags...</div>
            ) : plcTags.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No PLC tags configured for this site</p>
                <p className="text-sm">Add your first PLC tag to start monitoring</p>
              </div>
            ) : (
              <div className="space-y-4">
                {plcTags.map((tag: PlcTag) => (
                  <div key={tag.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold">{tag.tagName}</h3>
                          <p className="text-sm text-muted-foreground">{tag.plcAddress}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={tag.isActive ? "default" : "secondary"}>
                            {tag.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">{tag.dataType}</Badge>
                          <Badge 
                            variant={tag.severityLevel === "critical" ? "destructive" : tag.severityLevel === "warning" ? "default" : "secondary"}
                          >
                            {tag.severityLevel}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(tag)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteTagMutation.mutate(tag.id)}
                          disabled={deleteTagMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {tag.description && (
                      <p className="text-sm text-muted-foreground">{tag.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <span>Current Value:</span>
                        <Badge variant="outline">{tag.lastValue || "No data"}</Badge>
                      </div>
                      {tag.lastReadTime && (
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>Last read: {new Date(tag.lastReadTime).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm">
                      {tag.alarmOnTrue && (
                        <Badge variant="outline" className="text-xs">Alarm on TRUE</Badge>
                      )}
                      {tag.alarmOnFalse && (
                        <Badge variant="outline" className="text-xs">Alarm on FALSE</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit PLC Tag" : "Add New PLC Tag"}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tagName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tag Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Dosing Pump Trip" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BOOL">BOOL</SelectItem>
                          <SelectItem value="INT">INT</SelectItem>
                          <SelectItem value="REAL">REAL</SelectItem>
                          <SelectItem value="STRING">STRING</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="plcAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PLC Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., GVL.M_HYPO_DOSING_PUMP_TRIP" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional description of what this tag monitors" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="severityLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? "warning"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <Label>Tag Status</Label>
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0">Active</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Alarm Conditions</Label>
                <div className="flex space-x-6">
                  <FormField
                    control={form.control}
                    name="alarmOnTrue"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0">Create alarm when TRUE</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="alarmOnFalse"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0">Create alarm when FALSE</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createTagMutation.isPending || updateTagMutation.isPending}
                >
                  {editingTag ? "Update" : "Create"} PLC Tag
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}