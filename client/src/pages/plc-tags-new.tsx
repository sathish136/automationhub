import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PlcTag, InsertPlcTag } from "@shared/schema";
import {
  Activity,
  Upload,
  Edit,
  Save,
  X,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function PlcTagsPage() {
  const { toast } = useToast();
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<PlcTag>>({});
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [newTagData, setNewTagData] = useState<Partial<InsertPlcTag>>({});
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploadData, setBulkUploadData] = useState<string>("");

  // Fetch sites for selection
  const { data: sites = [] } = useQuery<any[]>({
    queryKey: ["/api/sites"],
  });

  // Fetch PLC tags for selected site
  const { data: plcTags = [], isLoading, refetch } = useQuery<PlcTag[]>({
    queryKey: ["/api/plc-tags", selectedSiteId],
    queryFn: () => fetch(`/api/plc-tags${selectedSiteId ? `?siteId=${selectedSiteId}` : ""}`).then(res => res.json()),
  });

  // Create PLC tag mutation
  const createTagMutation = useMutation({
    mutationFn: (data: InsertPlcTag) => 
      apiRequest("/api/plc-tags", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plc-tags"] });
      setShowNewTagForm(false);
      setNewTagData({});
      toast({
        title: "Success",
        description: "PLC tag created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create PLC tag",
        variant: "destructive",
      });
    },
  });

  // Update PLC tag mutation
  const updateTagMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertPlcTag> }) =>
      apiRequest(`/api/plc-tags/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plc-tags"] });
      setEditingTagId(null);
      setEditFormData({});
      toast({
        title: "Success",
        description: "PLC tag updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error?.message || "Failed to update PLC tag",
        variant: "destructive",
      });
    },
  });

  // Delete PLC tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/plc-tags/${id}`, "DELETE"),
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
        description: error?.message || "Failed to delete PLC tag",
        variant: "destructive",
      });
    },
  });

  // Bulk upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async (csvData: string) => {
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      if (!headers.includes('tagName') || !headers.includes('plcAddress')) {
        throw new Error("CSV must contain 'tagName' and 'plcAddress' columns");
      }

      const tags: InsertPlcTag[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const tagData: any = { siteId: selectedSiteId };
        
        headers.forEach((header, index) => {
          if (values[index]) {
            switch (header) {
              case 'isActive':
              case 'alarmOnTrue':
              case 'alarmOnFalse':
                tagData[header] = values[index].toLowerCase() === 'true';
                break;
              default:
                tagData[header] = values[index];
            }
          }
        });

        if (tagData.tagName && tagData.plcAddress) {
          tags.push({
            ...tagData,
            dataType: tagData.dataType || 'BOOL',
            severityLevel: tagData.severityLevel || 'warning',
            isActive: tagData.isActive ?? true,
            alarmOnTrue: tagData.alarmOnTrue ?? false,
            alarmOnFalse: tagData.alarmOnFalse ?? false,
          });
        }
      }

      // Create all tags
      for (const tag of tags) {
        await apiRequest("/api/plc-tags", "POST", tag);
      }
      
      return { count: tags.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/plc-tags"] });
      setShowBulkUpload(false);
      setBulkUploadData("");
      toast({
        title: "Success",
        description: `${result.count} PLC tags uploaded successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to upload PLC tags",
        variant: "destructive",
      });
    },
  });

  const dataTypeOptions = ["BOOL", "INT", "REAL", "STRING"];
  const severityOptions = ["info", "warning", "critical"];

  const handleEditStart = (tag: PlcTag) => {
    setEditingTagId(tag.id);
    setEditFormData({ ...tag });
  };

  const handleEditCancel = () => {
    setEditingTagId(null);
    setEditFormData({});
  };

  const handleEditSave = () => {
    if (editingTagId && editFormData) {
      updateTagMutation.mutate({ id: editingTagId, data: editFormData });
    }
  };

  const handleFieldChange = (field: keyof PlcTag, value: any) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewTag = () => {
    setShowNewTagForm(true);
    setNewTagData({ siteId: selectedSiteId });
  };

  const handleNewTagSave = () => {
    if (newTagData.tagName && newTagData.plcAddress && selectedSiteId) {
      createTagMutation.mutate({
        ...newTagData,
        siteId: selectedSiteId,
        dataType: newTagData.dataType || 'BOOL',
        severityLevel: newTagData.severityLevel || 'warning',
        isActive: newTagData.isActive ?? true,
        alarmOnTrue: newTagData.alarmOnTrue ?? false,
        alarmOnFalse: newTagData.alarmOnFalse ?? false,
      } as InsertPlcTag);
    } else {
      toast({
        title: "Validation Error",
        description: "Tag Name, PLC Address and Site selection are required",
        variant: "destructive",
      });
    }
  };

  const handleNewTagCancel = () => {
    setShowNewTagForm(false);
    setNewTagData({});
  };

  const handleNewTagChange = (field: keyof InsertPlcTag, value: any) => {
    setNewTagData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this PLC tag?")) {
      deleteTagMutation.mutate(id);
    }
  };

  const handleBulkUpload = () => {
    if (!selectedSiteId) {
      toast({
        title: "Site Required",
        description: "Please select a site first",
        variant: "destructive",
      });
      return;
    }
    if (!bulkUploadData.trim()) {
      toast({
        title: "Data Required",
        description: "Please enter CSV data",
        variant: "destructive",
      });
      return;
    }
    bulkUploadMutation.mutate(bulkUploadData);
  };

  const getStatusColor = (isActive: boolean | null | undefined) => {
    return isActive ? "bg-green-500" : "bg-gray-500";
  };

  const getSeverityColor = (severity: string | null | undefined) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="PLC Tag Monitoring"
        subtitle="Manage Beckhoff PLC tags and real-time monitoring configurations"
      />

      <div className="p-6">
        {/* Site Selection */}
        <div className="mb-6">
          <Label className="text-sm font-semibold text-gray-700 mb-2 block">Select Site</Label>
          <div className="w-full max-w-md">
            <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
              <SelectTrigger className="text-sm h-9 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                <SelectValue placeholder="Choose a site to manage PLC tags" />
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
        </div>

        {selectedSiteId && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                PLC Tags ({plcTags.length})
              </h3>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowBulkUpload(true)} 
                  variant="outline"
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg px-6 py-2"
                >
                  <Upload size={16} className="mr-2" />
                  Bulk Upload
                </Button>
                <Button 
                  onClick={handleNewTag} 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg px-6 py-2"
                >
                  <Activity size={16} className="mr-2" />
                  Add PLC Tag
                </Button>
              </div>
            </div>

            {/* New Tag Form */}
            {showNewTagForm && (
              <Card className="mb-6 border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50/30 to-white">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Activity size={20} />
                    Add New PLC Tag
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-8">
                    <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                      <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                        <Activity size={16} className="text-blue-600" />
                        Basic Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div>
                          <Label className="text-xs font-semibold text-gray-700">Tag Name</Label>
                          <Input
                            value={newTagData.tagName || ""}
                            onChange={(e) => handleNewTagChange("tagName", e.target.value)}
                            className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="Enter tag name"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-gray-700">PLC Address</Label>
                          <Input
                            value={newTagData.plcAddress || ""}
                            onChange={(e) => handleNewTagChange("plcAddress", e.target.value)}
                            className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="e.g., GVL.M_PUMP_TRIP"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-gray-700">Data Type</Label>
                          <Select
                            value={newTagData.dataType || "BOOL"}
                            onValueChange={(value) => handleNewTagChange("dataType", value)}
                          >
                            <SelectTrigger className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {dataTypeOptions.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-gray-700">Severity</Label>
                          <Select
                            value={newTagData.severityLevel || "warning"}
                            onValueChange={(value) => handleNewTagChange("severityLevel", value)}
                          >
                            <SelectTrigger className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {severityOptions.map((severity) => (
                                <SelectItem key={severity} value={severity}>{severity}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="newActive"
                              checked={newTagData.isActive ?? true}
                              onChange={(e) => handleNewTagChange("isActive", e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="newActive" className="text-xs font-semibold text-gray-700">Active</Label>
                          </div>
                        </div>
                        <div className="flex items-end">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="newAlarmTrue"
                              checked={newTagData.alarmOnTrue ?? false}
                              onChange={(e) => handleNewTagChange("alarmOnTrue", e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="newAlarmTrue" className="text-xs font-semibold text-gray-700">Alarm on TRUE</Label>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Label className="text-xs font-semibold text-gray-700">Description</Label>
                        <Textarea
                          value={newTagData.description || ""}
                          onChange={(e) => handleNewTagChange("description", e.target.value)}
                          className="text-sm mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder="Optional description"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <Button 
                      variant="outline" 
                      onClick={handleNewTagCancel}
                      className="px-6 py-2 text-sm font-medium"
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleNewTagSave}
                      disabled={createTagMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-6 py-2 text-sm"
                    >
                      <Save size={16} className="mr-2" />
                      {createTagMutation.isPending ? "Creating..." : "Create Tag"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bulk Upload Form */}
            {showBulkUpload && (
              <Card className="mb-6 border-2 border-green-200 shadow-lg bg-gradient-to-br from-green-50/30 to-white">
                <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Upload size={20} />
                    Bulk Upload PLC Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700 mb-2 block">CSV Format</Label>
                      <p className="text-xs text-gray-600 mb-2">
                        Required columns: tagName, plcAddress. Optional: dataType, severityLevel, description, isActive, alarmOnTrue, alarmOnFalse
                      </p>
                      <div className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-700">
                        tagName,plcAddress,dataType,severityLevel,description,isActive,alarmOnTrue<br />
                        Pump Trip,GVL.M_PUMP_TRIP,BOOL,critical,Main pump trip alarm,true,true<br />
                        Level Sensor,GVL.LEVEL_HIGH,BOOL,warning,High level sensor,true,true
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">CSV Data</Label>
                      <Textarea
                        value={bulkUploadData}
                        onChange={(e) => setBulkUploadData(e.target.value)}
                        className="mt-1 text-sm font-mono"
                        placeholder="Paste your CSV data here..."
                        rows={8}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowBulkUpload(false)}
                      className="px-6 py-2 text-sm font-medium"
                    >
                      <X size={16} className="mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleBulkUpload}
                      disabled={bulkUploadMutation.isPending}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium px-6 py-2 text-sm"
                    >
                      <Upload size={16} className="mr-2" />
                      {bulkUploadMutation.isPending ? "Uploading..." : "Upload Tags"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* PLC Tags Table */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading PLC tags...</div>
              ) : plcTags.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-semibold mb-2">No PLC Tags</h3>
                  <p className="text-sm">No PLC tags configured for this site. Add your first tag to start monitoring.</p>
                </div>
              ) : (
                plcTags.map((tag: PlcTag) => (
                  <Card key={tag.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      {editingTagId === tag.id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Tag Name</Label>
                              <Input
                                value={editFormData.tagName || ""}
                                onChange={(e) => handleFieldChange("tagName", e.target.value)}
                                className="text-sm h-9 mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-gray-700">PLC Address</Label>
                              <Input
                                value={editFormData.plcAddress || ""}
                                onChange={(e) => handleFieldChange("plcAddress", e.target.value)}
                                className="text-sm h-9 mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Data Type</Label>
                              <Select
                                value={editFormData.dataType || "BOOL"}
                                onValueChange={(value) => handleFieldChange("dataType", value)}
                              >
                                <SelectTrigger className="text-sm h-9 mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {dataTypeOptions.map((type) => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Severity</Label>
                              <Select
                                value={editFormData.severityLevel || "warning"}
                                onValueChange={(value) => handleFieldChange("severityLevel", value)}
                              >
                                <SelectTrigger className="text-sm h-9 mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {severityOptions.map((severity) => (
                                    <SelectItem key={severity} value={severity}>{severity}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-end">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`active-${tag.id}`}
                                  checked={editFormData.isActive ?? true}
                                  onChange={(e) => handleFieldChange("isActive", e.target.checked)}
                                  className="rounded border-gray-300"
                                />
                                <Label htmlFor={`active-${tag.id}`} className="text-xs font-semibold text-gray-700">Active</Label>
                              </div>
                            </div>
                            <div className="flex items-end">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`alarm-${tag.id}`}
                                  checked={editFormData.alarmOnTrue ?? false}
                                  onChange={(e) => handleFieldChange("alarmOnTrue", e.target.checked)}
                                  className="rounded border-gray-300"
                                />
                                <Label htmlFor={`alarm-${tag.id}`} className="text-xs font-semibold text-gray-700">Alarm on TRUE</Label>
                              </div>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">Description</Label>
                            <Textarea
                              value={editFormData.description || ""}
                              onChange={(e) => handleFieldChange("description", e.target.value)}
                              className="text-sm mt-1"
                              rows={2}
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={handleEditCancel}>
                              <X size={16} className="mr-1" />
                              Cancel
                            </Button>
                            <Button size="sm" onClick={handleEditSave} disabled={updateTagMutation.isPending}>
                              <Save size={16} className="mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div>
                                <h3 className="text-sm font-semibold text-gray-900">{tag.tagName}</h3>
                                <p className="text-xs text-gray-600 font-mono">{tag.plcAddress}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(tag.isActive)}`}></div>
                                <Badge variant="outline" className="text-xs">
                                  {tag.dataType}
                                </Badge>
                                <div className={`w-2 h-2 rounded-full ${getSeverityColor(tag.severityLevel)}`}></div>
                                <span className="text-xs text-gray-600 capitalize">{tag.severityLevel}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditStart(tag)}>
                                <Edit size={14} />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDelete(tag.id)}>
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                          
                          {tag.description && (
                            <p className="text-xs text-gray-600">{tag.description}</p>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <span>Value:</span>
                                <Badge variant="outline" className="text-xs">
                                  {tag.lastValue || "No data"}
                                </Badge>
                              </div>
                              {tag.alarmOnTrue && (
                                <div className="flex items-center space-x-1">
                                  <AlertTriangle size={12} className="text-orange-500" />
                                  <span>Alarm on TRUE</span>
                                </div>
                              )}
                              {tag.alarmOnFalse && (
                                <div className="flex items-center space-x-1">
                                  <CheckCircle size={12} className="text-blue-500" />
                                  <span>Alarm on FALSE</span>
                                </div>
                              )}
                            </div>
                            {tag.lastReadTime && (
                              <div className="flex items-center space-x-1">
                                <Clock size={12} />
                                <span>Last read: {new Date(tag.lastReadTime).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}