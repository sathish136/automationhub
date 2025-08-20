import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { IpcManagement, InsertIpcManagement } from "@shared/schema";
import {
  Monitor,
  Cpu,
  Wifi,
  Router,
  Key,
  Activity,
  Edit,
  Save,
  X,
  Check,
  Eye,
  EyeOff,
  Lock,
  FileText,
  Network,
  Image,
  Upload,
} from "lucide-react";

// Using types from shared schema

export default function IPCDetails() {
  const { toast } = useToast();
  const [selectedIPCId, setSelectedIPCId] = useState<string | null>(null);
  const [editingIPCId, setEditingIPCId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<IpcManagement>>({});
  const [showNewIPCForm, setShowNewIPCForm] = useState(false);
  const [newIPCData, setNewIPCData] = useState<Partial<InsertIpcManagement>>({});
  const [showPasswords, setShowPasswords] = useState<{
    [key: string]: boolean;
  }>({});

  // Fetch IPC devices from API
  const { data: ipcDevices = [], isLoading, refetch } = useQuery<IpcManagement[]>({
    queryKey: ["/api/ipc-management"],
    queryFn: () => fetch("/api/ipc-management").then(res => res.json()),
  });

  // Create IPC device mutation
  const createIpcMutation = useMutation({
    mutationFn: (data: InsertIpcManagement) => 
      apiRequest("/api/ipc-management", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ipc-management"] });
      setShowNewIPCForm(false);
      setNewIPCData({});
      toast({
        title: "Success",
        description: "IPC device created successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error creating IPC device:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create IPC device",
        variant: "destructive",
      });
    },
  });

  // Update IPC device mutation
  const updateIpcMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertIpcManagement> }) =>
      apiRequest(`/api/ipc-management/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ipc-management"] });
      setEditingIPCId(null);
      setEditFormData({});
      toast({
        title: "Success",
        description: "IPC device updated successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error updating IPC device:", error);
      toast({
        title: "Error", 
        description: error?.message || "Failed to update IPC device",
        variant: "destructive",
      });
    },
  });

  // Delete IPC device mutation
  const deleteIpcMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/ipc-management/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ipc-management"] });
      setSelectedIPCId(null);
      toast({
        title: "Success",
        description: "IPC device deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting IPC device:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete IPC device",
        variant: "destructive",
      });
    },
  });

  const statusOptions = ["Active", "Inactive", "Maintenance", "Offline"];
  const dhcpOptions = ["Enable", "Disabled"];
  const manufactureOptions = ["Beckhoff", "Siemens", "Allen-Bradley", "Other"];
  const modelOptions = ["C6015-0010", "C6025-0010", "C5102-0010", "Other"];
  const mainboardOptions = ["CV263-0005", "CV263-0010", "Other"];
  const cpuOptions = ["Atom E3827 1.75Ghz", "Atom E3845 1.91Ghz", "Other"];
  const flashOptions = ["SSD 40 GB 3D-Flash", "SSD 80 GB 3D-Flash", "Other"];
  const powerSupplyOptions = ["24V DC, Class2", "12V DC, Class2", "Other"];
  const memoryOptions = ["4 x 1024 MN DDR3L", "8 x 1024 MN DDR3L", "Other"];
  const osOptions = ["Windows 10", "Windows 11", "Linux", "Other"];

  const handleEditStart = (ipc: IpcManagement) => {
    setEditingIPCId(ipc.id);
    setEditFormData({ ...ipc });
  };

  const handleEditCancel = () => {
    setEditingIPCId(null);
    setEditFormData({});
  };

  const handleEditSave = () => {
    if (editingIPCId && editFormData) {
      updateIpcMutation.mutate({ id: editingIPCId, data: editFormData });
    }
  };

  const handleFieldChange = (field: keyof IpcManagement, value: any) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewIPC = () => {
    setShowNewIPCForm(true);
    setNewIPCData({});
  };

  const handleNewIPCSave = () => {
    if (newIPCData.deviceName && newIPCData.amsNetId) {
      console.log("Submitting IPC data:", newIPCData);
      createIpcMutation.mutate(newIPCData as InsertIpcManagement);
    } else {
      toast({
        title: "Validation Error",
        description: "Device Name and AMS Net ID are required",
        variant: "destructive",
      });
    }
  };

  const handleNewIPCCancel = () => {
    setShowNewIPCForm(false);
    setNewIPCData({});
  };

  const handleNewIPCChange = (field: keyof InsertIpcManagement, value: any) => {
    setNewIPCData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this IPC device?")) {
      deleteIpcMutation.mutate(id);
    }
  };

  const togglePasswordVisibility = (ipcId: string | number) => {
    setShowPasswords((prev) => ({
      ...prev,
      [ipcId]: !prev[ipcId],
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500";
      case "Inactive":
        return "bg-gray-500";
      case "Maintenance":
        return "bg-yellow-500";
      case "Offline":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // If no IPC selected, show IPC list
  if (!selectedIPCId) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          title="IPC Management"
          subtitle="Manage Industrial PC devices and configurations"
        />

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              IPC Devices ({ipcDevices.length})
            </h3>
            <Button 
              onClick={handleNewIPC} 
              data-testid="button-new-ipc"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg px-6 py-2"
            >
              <Monitor size={16} className="mr-2" />
              Add IPC Device
            </Button>
          </div>

          {/* New IPC Form */}
          {showNewIPCForm && (
            <Card className="mb-6 border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50/30 to-white">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Monitor size={20} />
                  Add New IPC Device
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-8">
                  {/* Basic Details Section */}
                  <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                      <Monitor size={16} className="text-blue-600" />
                      Basic Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Device Name</Label>
                        <Input
                          value={newIPCData.deviceName || ""}
                          onChange={(e) =>
                            handleNewIPCChange("deviceName", e.target.value)
                          }
                          className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder="Enter device name"
                          data-testid="new-device-name"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">AMS Net ID</Label>
                        <Input
                          value={newIPCData.amsNetId || ""}
                          onChange={(e) =>
                            handleNewIPCChange("amsNetId", e.target.value)
                          }
                          className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder="Enter AMS Net ID"
                          data-testid="new-ams-id"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Status</Label>
                        <Select
                          value={newIPCData.status || "Active"}
                          onValueChange={(value) => handleNewIPCChange("status", value)}
                        >
                          <SelectTrigger className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all" data-testid="new-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                    </div>
                  </div>

                  {/* Remote Access Section */}
                  <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                      <Lock size={16} className="text-green-600" />
                      Remote Access
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs font-medium">AnyDesk ID</Label>
                        <Input
                          value={newIPCData.anydesk || ""}
                          onChange={(e) =>
                            handleNewIPCChange("anydesk", e.target.value)
                          }
                          className="text-sm h-8 mt-1"
                          placeholder="AnyDesk ID"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">AnyDesk Password</Label>
                        <Input
                          type="password"
                          value={newIPCData.anydeskPassword || ""}
                          onChange={(e) =>
                            handleNewIPCChange("anydeskPassword", e.target.value)
                          }
                          className="text-sm h-8 mt-1"
                          placeholder="Password"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">TeamViewer ID</Label>
                        <Input
                          value={newIPCData.teamviewer || ""}
                          onChange={(e) =>
                            handleNewIPCChange("teamviewer", e.target.value)
                          }
                          className="text-sm h-8 mt-1"
                          placeholder="TeamViewer ID"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Naming Series</Label>
                        <Input
                          value={newIPCData.namingSeries || ""}
                          onChange={(e) =>
                            handleNewIPCChange("namingSeries", e.target.value)
                          }
                          className="text-sm h-8 mt-1"
                          placeholder="Naming series"
                        />
                      </div>
                    </div>
                  </div>

                  {/* IPC Credentials Section */}
                  <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                      <Key size={16} className="text-orange-600" />
                      IPC Credentials
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium">IPC Username</Label>
                        <Input
                          value={newIPCData.ipcUsername || ""}
                          onChange={(e) =>
                            handleNewIPCChange("ipcUsername", e.target.value)
                          }
                          className="text-sm h-8 mt-1"
                          placeholder="Username"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">IPC Password</Label>
                        <Input
                          type="password"
                          value={newIPCData.ipcPassword || ""}
                          onChange={(e) =>
                            handleNewIPCChange("ipcPassword", e.target.value)
                          }
                          className="text-sm h-8 mt-1"
                          placeholder="Password"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hardware Specs Section */}
                  <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                      <Cpu size={16} className="text-purple-600" />
                      Hardware Specifications
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Manufacturer</Label>
                        <Input
                          value={newIPCData.manufacture || ""}
                          onChange={(e) =>
                            handleNewIPCChange("manufacture", e.target.value)
                          }
                          className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder="Manufacturer"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Model</Label>
                        <Input
                          value={newIPCData.model || ""}
                          onChange={(e) =>
                            handleNewIPCChange("model", e.target.value)
                          }
                          className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder="Model"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Serial Number</Label>
                        <Input
                          value={newIPCData.serialNo || ""}
                          onChange={(e) =>
                            handleNewIPCChange("serialNo", e.target.value)
                          }
                          className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder="Serial number"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Mainboard</Label>
                        <Input
                          value={newIPCData.mainboard || ""}
                          onChange={(e) =>
                            handleNewIPCChange("mainboard", e.target.value)
                          }
                          className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder="Mainboard"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">CPU</Label>
                        <Input
                          value={newIPCData.cpu || ""}
                          onChange={(e) =>
                            handleNewIPCChange("cpu", e.target.value)
                          }
                          className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder="CPU model"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Flash</Label>
                        <Input
                          value={newIPCData.flash || ""}
                          onChange={(e) =>
                            handleNewIPCChange("flash", e.target.value)
                          }
                          className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder="Flash storage"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Power Supply</Label>
                        <Input
                          value={newIPCData.powerSupply || ""}
                          onChange={(e) =>
                            handleNewIPCChange("powerSupply", e.target.value)
                          }
                          className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder="Power supply"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Memory</Label>
                        <Input
                          value={newIPCData.memory || ""}
                          onChange={(e) =>
                            handleNewIPCChange("memory", e.target.value)
                          }
                          className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder="Memory"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">MAC 1</Label>
                        <Input
                          value={newIPCData.mac1 || ""}
                          onChange={(e) =>
                            handleNewIPCChange("mac1", e.target.value)
                          }
                          className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder="MAC address 1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">MAC 2</Label>
                        <Input
                          value={newIPCData.mac2 || ""}
                          onChange={(e) =>
                            handleNewIPCChange("mac2", e.target.value)
                          }
                          className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder="MAC address 2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Operating System</Label>
                        <Input
                          value={newIPCData.operatingSystem || ""}
                          onChange={(e) =>
                            handleNewIPCChange("operatingSystem", e.target.value)
                          }
                          className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder="Operating system"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Image Version</Label>
                        <Input
                          value={newIPCData.imageVersion || ""}
                          onChange={(e) =>
                            handleNewIPCChange("imageVersion", e.target.value)
                          }
                          className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder="Image version"
                        />
                      </div>
                      <div className="col-span-full">
                        <Label className="text-xs font-semibold text-gray-700">IPC Image</Label>
                        <div className="mt-1">
                          <Input
                            value={newIPCData.ipcImage || ""}
                            onChange={(e) =>
                              handleNewIPCChange("ipcImage", e.target.value)
                            }
                            className="text-sm h-9 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="Enter image URL or upload image"
                            data-testid="new-ipc-image"
                          />
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = (e: any) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    // For demo purposes, create a local URL
                                    const imageUrl = URL.createObjectURL(file);
                                    handleNewIPCChange("ipcImage", imageUrl);
                                  }
                                };
                                input.click();
                              }}
                              data-testid="new-upload-ipc-image"
                            >
                              <Upload size={14} className="mr-1" />
                              Upload Image
                            </Button>
                            {newIPCData.ipcImage && (
                              <div className="flex items-center gap-2">
                                <img 
                                  src={newIPCData.ipcImage} 
                                  alt="IPC Preview" 
                                  className="w-8 h-8 object-cover rounded border"
                                  onError={(e: any) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                                <span className="text-xs text-green-600">Image uploaded</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-gray-700">Serial Number of IPC</Label>
                        <Input
                          value={newIPCData.serialNumberOfIpc || ""}
                          onChange={(e) =>
                            handleNewIPCChange("serialNumberOfIpc", e.target.value)
                          }
                          className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                          placeholder="Serial number of IPC"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Network Configuration Section */}
                  <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                      <Network size={16} className="text-indigo-600" />
                      Network Configuration
                    </h4>
                    <div className="space-y-6">
                      {/* Basic Network Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs font-semibold text-gray-700">VPN IP</Label>
                          <Input
                            value={newIPCData.vpnIp || ""}
                            onChange={(e) =>
                              handleNewIPCChange("vpnIp", e.target.value)
                            }
                            className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="VPN IP address"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-gray-700">LAN IP</Label>
                          <Input
                            value={newIPCData.lanIp || ""}
                            onChange={(e) =>
                              handleNewIPCChange("lanIp", e.target.value)
                            }
                            className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="LAN IP address"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold text-gray-700">Device Manager Version</Label>
                          <Input
                            value={newIPCData.deviceManagerVersion || ""}
                            onChange={(e) =>
                              handleNewIPCChange("deviceManagerVersion", e.target.value)
                            }
                            className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            placeholder="Device manager version"
                          />
                        </div>
                      </div>

                      {/* Network 1 Configuration */}
                      <div>
                        <h5 className="text-xs font-semibold text-gray-600 mb-3 bg-gray-50 px-2 py-1 rounded">Network 1</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">Name</Label>
                            <Input
                              value={newIPCData.network1Name || ""}
                              onChange={(e) =>
                                handleNewIPCChange("network1Name", e.target.value)
                              }
                              className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              placeholder="Network name"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">Virtual Device</Label>
                            <Input
                              value={newIPCData.network1VirtualDevice || ""}
                              onChange={(e) =>
                                handleNewIPCChange("network1VirtualDevice", e.target.value)
                              }
                              className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              placeholder="Virtual device name"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">Gateway</Label>
                            <Input
                              value={newIPCData.network1Gateway || ""}
                              onChange={(e) =>
                                handleNewIPCChange("network1Gateway", e.target.value)
                              }
                              className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              placeholder="Gateway"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">IP Address</Label>
                            <Input
                              value={newIPCData.network1Address || ""}
                              onChange={(e) =>
                                handleNewIPCChange("network1Address", e.target.value)
                              }
                              className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              placeholder="IP address"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">DHCP</Label>
                            <Select
                              value={newIPCData.network1Dhcp || ""}
                              onValueChange={(value) => handleNewIPCChange("network1Dhcp", value)}
                            >
                              <SelectTrigger className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                                <SelectValue placeholder="DHCP" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Enable">Enable</SelectItem>
                                <SelectItem value="Disabled">Disabled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">Subnet Mask</Label>
                            <Input
                              value={newIPCData.network1SubnetMask || ""}
                              onChange={(e) =>
                                handleNewIPCChange("network1SubnetMask", e.target.value)
                              }
                              className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              placeholder="Subnet mask"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">DNS Servers</Label>
                            <Input
                              value={newIPCData.network1DnsServers || ""}
                              onChange={(e) =>
                                handleNewIPCChange("network1DnsServers", e.target.value)
                              }
                              className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              placeholder="DNS servers"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">MAC Address</Label>
                            <Input
                              value={newIPCData.network1MacAddress || ""}
                              onChange={(e) =>
                                handleNewIPCChange("network1MacAddress", e.target.value)
                              }
                              className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              placeholder="MAC address"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Network 2 Configuration */}
                      <div>
                        <h5 className="text-xs font-semibold text-gray-600 mb-3 bg-gray-50 px-2 py-1 rounded">Network 2</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">Name</Label>
                            <Input
                              value={newIPCData.network2Name || ""}
                              onChange={(e) =>
                                handleNewIPCChange("network2Name", e.target.value)
                              }
                              className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              placeholder="Network name"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">Virtual Device</Label>
                            <Input
                              value={newIPCData.network2VirtualDevice || ""}
                              onChange={(e) =>
                                handleNewIPCChange("network2VirtualDevice", e.target.value)
                              }
                              className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              placeholder="Virtual device name"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">Gateway</Label>
                            <Input
                              value={newIPCData.network2Gateway || ""}
                              onChange={(e) =>
                                handleNewIPCChange("network2Gateway", e.target.value)
                              }
                              className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              placeholder="Gateway"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">IP Address</Label>
                            <Input
                              value={newIPCData.network2Address || ""}
                              onChange={(e) =>
                                handleNewIPCChange("network2Address", e.target.value)
                              }
                              className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              placeholder="IP address"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">DHCP</Label>
                            <Select
                              value={newIPCData.network2Dhcp || ""}
                              onValueChange={(value) => handleNewIPCChange("network2Dhcp", value)}
                            >
                              <SelectTrigger className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                                <SelectValue placeholder="DHCP" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Enable">Enable</SelectItem>
                                <SelectItem value="Disabled">Disabled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">Subnet Mask</Label>
                            <Input
                              value={newIPCData.network2SubnetMask || ""}
                              onChange={(e) =>
                                handleNewIPCChange("network2SubnetMask", e.target.value)
                              }
                              className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              placeholder="Subnet mask"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">DNS Servers</Label>
                            <Input
                              value={newIPCData.network2DnsServers || ""}
                              onChange={(e) =>
                                handleNewIPCChange("network2DnsServers", e.target.value)
                              }
                              className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              placeholder="DNS servers"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-700">MAC Address</Label>
                            <Input
                              value={newIPCData.network2MacAddress || ""}
                              onChange={(e) =>
                                handleNewIPCChange("network2MacAddress", e.target.value)
                              }
                              className="text-sm h-9 mt-1 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                              placeholder="MAC address"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
                      <FileText size={16} className="text-gray-600" />
                      Additional Information
                    </h4>
                    <div>
                      <Label className="text-xs font-medium">Comments</Label>
                      <Input
                        value={newIPCData.comments || ""}
                        onChange={(e) =>
                          handleNewIPCChange("comments", e.target.value)
                        }
                        className="text-sm h-8 mt-1"
                        placeholder="Optional comments..."
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={handleNewIPCCancel}
                    data-testid="cancel-new-ipc"
                    className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleNewIPCSave} 
                    data-testid="save-new-ipc"
                    disabled={createIpcMutation.isPending}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createIpcMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Monitor size={16} className="mr-2" />
                        Add IPC Device
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">
                        Device Name
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">
                        AMS Net ID
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">
                        VPN IP
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">
                        LAN IP
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">
                        Model
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700 text-xs">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ipcDevices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <div className="text-gray-500">
                            <Monitor
                              size={48}
                              className="mx-auto mb-4 text-gray-300"
                            />
                            <h3 className="text-sm font-medium text-gray-900 mb-2">
                              No IPC Devices Found
                            </h3>
                            <p className="text-xs text-gray-600 mb-4">
                              Get started by adding your first IPC device
                            </p>
                            <Button onClick={handleNewIPC} size="sm">
                              <Monitor size={14} className="mr-2" />
                              Add First IPC Device
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      ipcDevices.map((ipc, index) => (
                        <tr
                          key={ipc.id}
                          className={`border-b hover:bg-gray-50 cursor-pointer ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                          }`}
                          onClick={() => setSelectedIPCId(ipc.id)}
                          data-testid={`ipc-row-${ipc.id}`}
                        >
                          <td className="py-4 px-4">
                            <div className="font-medium text-gray-900 text-sm">
                              {ipc.deviceName}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-600 text-sm">
                              {ipc.amsNetId}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              variant="secondary"
                              className={`text-xs text-white ${getStatusColor(ipc.status)}`}
                            >
                              {ipc.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-600 text-sm">
                              {ipc.vpnIp}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-600 text-sm">
                              {ipc.lanIp}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-gray-600 text-sm">
                              {ipc.model}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedIPCId(ipc.id);
                                }}
                                data-testid={`view-ipc-${ipc.id}`}
                                title="View details"
                              >
                                <Eye size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditStart(ipc);
                                  setSelectedIPCId(ipc.id);
                                }}
                                data-testid={`edit-ipc-${ipc.id}`}
                                title="Edit device"
                              >
                                <Edit size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(ipc.id);
                                }}
                                data-testid={`delete-ipc-${ipc.id}`}
                                title="Delete device"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={deleteIpcMutation.isPending}
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show detailed view for selected IPC
  const selectedIPC = ipcDevices.find((ipc) => ipc.id === selectedIPCId);
  if (!selectedIPC) return null;

  const isEditing = editingIPCId === selectedIPC.id;
  const currentData = isEditing
    ? { ...selectedIPC, ...editFormData }
    : selectedIPC;

  return (
    <div className="min-h-screen bg-background">
      <Header
        title={`IPC Device - ${selectedIPC.deviceName}`}
        subtitle={`${selectedIPC.amsNetId} - Device Configuration`}
      />

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedIPCId(null)}
            data-testid="button-back-to-list"
          >
            ← Back to IPC List
          </Button>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleEditCancel}
                  data-testid="cancel-edit-ipc"
                >
                  <X size={16} className="mr-2" />
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditSave} 
                  data-testid="save-edit-ipc"
                  disabled={updateIpcMutation.isPending}
                >
                  <Save size={16} className="mr-2" />
                  {updateIpcMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedIPC.id)}
                  data-testid="delete-ipc"
                  disabled={deleteIpcMutation.isPending}
                >
                  <X size={16} className="mr-2" />
                  {deleteIpcMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
                <Button
                  onClick={() => handleEditStart(selectedIPC)}
                  data-testid="edit-ipc"
                >
                  <Edit size={16} className="mr-2" />
                  Edit Device
                </Button>
              </>
            )}
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Monitor size={16} />
              Details
            </TabsTrigger>
            <TabsTrigger value="ipc-cpu" className="flex items-center gap-2">
              <Cpu size={16} />
              IPC CPU
            </TabsTrigger>
            <TabsTrigger value="connectivity" className="flex items-center gap-2">
              <Wifi size={16} />
              Connectivity
            </TabsTrigger>
            <TabsTrigger value="router" className="flex items-center gap-2">
              <Router size={16} />
              Router
            </TabsTrigger>
            <TabsTrigger value="passwords" className="flex items-center gap-2">
              <Key size={16} />
              Passwords
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Monitor size={18} />
                  General Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Status</Label>
                    {isEditing ? (
                      <Select
                        value={currentData.status}
                        onValueChange={(value) => handleFieldChange('status', value)}
                      >
                        <SelectTrigger className="text-sm h-8 mt-1" data-testid="edit-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge 
                        variant="secondary" 
                        className={`text-xs text-white ${getStatusColor(currentData.status)} mt-1`}
                      >
                        {currentData.status}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">AMS Net ID</Label>
                    {isEditing ? (
                      <Input 
                        value={currentData.amsNetId || ''}
                        onChange={(e) => handleFieldChange('amsNetId', e.target.value)}
                        className="text-sm h-8 mt-1"
                        data-testid="edit-ams-id"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.amsNetId}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">VPN IP</Label>
                    {isEditing ? (
                      <Input 
                        value={currentData.vpnIp || ''}
                        onChange={(e) => handleFieldChange('vpnIp', e.target.value)}
                        className="text-sm h-8 mt-1"
                        data-testid="edit-vpn-ip"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.vpnIp}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">LAN IP</Label>
                    {isEditing ? (
                      <Input 
                        value={currentData.lanIp || ''}
                        onChange={(e) => handleFieldChange('lanIp', e.target.value)}
                        className="text-sm h-8 mt-1"
                        data-testid="edit-lan-ip"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.lanIp}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Device Name</Label>
                    {isEditing ? (
                      <Input 
                        value={currentData.deviceName || ''}
                        onChange={(e) => handleFieldChange('deviceName', e.target.value)}
                        className="text-sm h-8 mt-1"
                        data-testid="edit-device-name"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.deviceName}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Naming Series</Label>
                    {isEditing ? (
                      <Input 
                        value={currentData.namingSeries || ''}
                        onChange={(e) => handleFieldChange('namingSeries', e.target.value)}
                        className="text-sm h-8 mt-1"
                        data-testid="edit-naming-series"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.namingSeries}</div>
                    )}
                  </div>
                </div>
                
                <div className="mt-6">
                  <Label className="text-xs font-medium text-gray-700">Comments</Label>
                  {isEditing ? (
                    <Textarea 
                      value={currentData.comments || ''}
                      onChange={(e) => handleFieldChange('comments', e.target.value)}
                      className="text-sm mt-1"
                      rows={3}
                      placeholder="Add any additional notes or comments about this device..."
                      data-testid="edit-comments"
                    />
                  ) : (
                    <div className="text-sm text-gray-900 mt-1">
                      {currentData.comments || "No comments"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* IPC CPU Tab */}
          <TabsContent value="ipc-cpu" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Cpu size={18} />
                  Hardware Specifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Manufacture</Label>
                    {isEditing ? (
                      <Select
                        value={currentData.manufacture || ''}
                        onValueChange={(value) => handleFieldChange('manufacture', value)}
                      >
                        <SelectTrigger className="text-sm h-8 mt-1" data-testid="edit-manufacture">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {manufactureOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.manufacture}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Model</Label>
                    {isEditing ? (
                      <Select
                        value={currentData.model || ''}
                        onValueChange={(value) => handleFieldChange('model', value)}
                      >
                        <SelectTrigger className="text-sm h-8 mt-1" data-testid="edit-model">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {modelOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.model}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Serial No</Label>
                    {isEditing ? (
                      <Input 
                        value={currentData.serialNo || ''}
                        onChange={(e) => handleFieldChange('serialNo', e.target.value)}
                        className="text-sm h-8 mt-1"
                        data-testid="edit-serial-no"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.serialNo}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Mainboard</Label>
                    {isEditing ? (
                      <Select
                        value={currentData.mainboard || ''}
                        onValueChange={(value) => handleFieldChange('mainboard', value)}
                      >
                        <SelectTrigger className="text-sm h-8 mt-1" data-testid="edit-mainboard">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {mainboardOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.mainboard}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">CPU</Label>
                    {isEditing ? (
                      <Select
                        value={currentData.cpu || ''}
                        onValueChange={(value) => handleFieldChange('cpu', value)}
                      >
                        <SelectTrigger className="text-sm h-8 mt-1" data-testid="edit-cpu">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {cpuOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.cpu}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Flash</Label>
                    {isEditing ? (
                      <Select
                        value={currentData.flash || ''}
                        onValueChange={(value) => handleFieldChange('flash', value)}
                      >
                        <SelectTrigger className="text-sm h-8 mt-1" data-testid="edit-flash">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {flashOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.flash}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Power Supply</Label>
                    {isEditing ? (
                      <Select
                        value={currentData.powerSupply || ''}
                        onValueChange={(value) => handleFieldChange('powerSupply', value)}
                      >
                        <SelectTrigger className="text-sm h-8 mt-1" data-testid="edit-power-supply">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {powerSupplyOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.powerSupply}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Memory</Label>
                    {isEditing ? (
                      <Select
                        value={currentData.memory || ''}
                        onValueChange={(value) => handleFieldChange('memory', value)}
                      >
                        <SelectTrigger className="text-sm h-8 mt-1" data-testid="edit-memory">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {memoryOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.memory}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Operating System</Label>
                    {isEditing ? (
                      <Select
                        value={currentData.operatingSystem || ''}
                        onValueChange={(value) => handleFieldChange('operatingSystem', value)}
                      >
                        <SelectTrigger className="text-sm h-8 mt-1" data-testid="edit-os">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {osOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.operatingSystem}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">MAC Address 1</Label>
                    {isEditing ? (
                      <Input 
                        value={currentData.mac1 || ''}
                        onChange={(e) => handleFieldChange('mac1', e.target.value)}
                        className="text-sm h-8 mt-1"
                        data-testid="edit-mac1"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.mac1}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">MAC Address 2</Label>
                    {isEditing ? (
                      <Input 
                        value={currentData.mac2 || ''}
                        onChange={(e) => handleFieldChange('mac2', e.target.value)}
                        className="text-sm h-8 mt-1"
                        data-testid="edit-mac2"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.mac2}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Image Version</Label>
                    {isEditing ? (
                      <Input 
                        value={currentData.imageVersion || ''}
                        onChange={(e) => handleFieldChange('imageVersion', e.target.value)}
                        className="text-sm h-8 mt-1"
                        data-testid="edit-image-version"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.imageVersion}</div>
                    )}
                  </div>
                  <div className="col-span-full">
                    <Label className="text-xs font-medium text-gray-700">IPC Image</Label>
                    {isEditing ? (
                      <div className="mt-1">
                        <Input 
                          value={currentData.ipcImage || ''}
                          onChange={(e) => handleFieldChange('ipcImage', e.target.value)}
                          className="text-sm h-8"
                          placeholder="Enter image URL or upload image"
                          data-testid="edit-ipc-image"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e: any) => {
                              const file = e.target.files[0];
                              if (file) {
                                // For demo purposes, create a local URL
                                const imageUrl = URL.createObjectURL(file);
                                handleFieldChange('ipcImage', imageUrl);
                              }
                            };
                            input.click();
                          }}
                          data-testid="upload-ipc-image"
                        >
                          <Upload size={14} className="mr-1" />
                          Upload Image
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-1">
                        {currentData.ipcImage ? (
                          <div className="flex items-center gap-3">
                            <img 
                              src={currentData.ipcImage} 
                              alt="IPC Device" 
                              className="w-16 h-16 object-cover rounded border"
                              onError={(e: any) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div 
                              className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center hidden"
                            >
                              <Image size={20} className="text-gray-400" />
                            </div>
                            <div className="text-sm text-gray-900">Image uploaded</div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                              <Image size={20} className="text-gray-400" />
                            </div>
                            <div className="text-sm text-gray-500">No image uploaded</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Serial Number of IPC</Label>
                    {isEditing ? (
                      <Input 
                        value={currentData.serialNumberOfIpc || ''}
                        onChange={(e) => handleFieldChange('serialNumberOfIpc', e.target.value)}
                        className="text-sm h-8 mt-1"
                        data-testid="edit-serial-number-ipc"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.serialNumberOfIpc}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">Device Manager Version</Label>
                    {isEditing ? (
                      <Input 
                        value={currentData.deviceManagerVersion || ''}
                        onChange={(e) => handleFieldChange('deviceManagerVersion', e.target.value)}
                        className="text-sm h-8 mt-1"
                        data-testid="edit-device-manager-version"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.deviceManagerVersion}</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connectivity Tab */}
          <TabsContent value="connectivity" className="mt-6">
            <div className="space-y-6">
              {/* Remote Access Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wifi size={18} />
                    Remote Access Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-700">AnyDesk ID</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.anydesk || ''}
                          onChange={(e) => handleFieldChange('anydesk', e.target.value)}
                          className="text-sm h-8 mt-1"
                          placeholder="123456789"
                          data-testid="edit-anydesk"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.anydesk || 'Not configured'}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">TeamViewer ID</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.teamviewer || ''}
                          onChange={(e) => handleFieldChange('teamviewer', e.target.value)}
                          className="text-sm h-8 mt-1"
                          placeholder="123 456 789"
                          data-testid="edit-teamviewer"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.teamviewer || 'Not configured'}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Network 1 Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Router size={18} />
                    Network 1 Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Network Name</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network1Name || ''}
                          onChange={(e) => handleFieldChange('network1Name', e.target.value)}
                          className="text-sm h-8 mt-1"
                          data-testid="edit-network1-name"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network1Name}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Virtual Device</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network1VirtualDevice || ''}
                          onChange={(e) => handleFieldChange('network1VirtualDevice', e.target.value)}
                          className="text-sm h-8 mt-1"
                          data-testid="edit-network1-virtual-device"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network1VirtualDevice}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Gateway</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network1Gateway || ''}
                          onChange={(e) => handleFieldChange('network1Gateway', e.target.value)}
                          className="text-sm h-8 mt-1"
                          data-testid="edit-network1-gateway"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network1Gateway}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Address</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network1Address || ''}
                          onChange={(e) => handleFieldChange('network1Address', e.target.value)}
                          className="text-sm h-8 mt-1"
                          data-testid="edit-network1-address"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network1Address}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">DHCP</Label>
                      {isEditing ? (
                        <Select
                          value={currentData.network1Dhcp || ''}
                          onValueChange={(value) => handleFieldChange('network1Dhcp', value)}
                        >
                          <SelectTrigger className="text-sm h-8 mt-1" data-testid="edit-network1-dhcp">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {dhcpOptions.map(dhcp => (
                              <SelectItem key={dhcp} value={dhcp}>{dhcp}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network1Dhcp}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Subnet Mask</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network1SubnetMask || ''}
                          onChange={(e) => handleFieldChange('network1SubnetMask', e.target.value)}
                          className="text-sm h-8 mt-1"
                          data-testid="edit-network1-subnet"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network1SubnetMask}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">DNS Servers</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network1DnsServers || ''}
                          onChange={(e) => handleFieldChange('network1DnsServers', e.target.value)}
                          className="text-sm h-8 mt-1"
                          data-testid="edit-network1-dns"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network1DnsServers}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">MAC Address</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network1MacAddress || ''}
                          onChange={(e) => handleFieldChange('network1MacAddress', e.target.value)}
                          className="text-sm h-8 mt-1"
                          data-testid="edit-network1-mac"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network1MacAddress}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Network 2 Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Router size={18} />
                    Network 2 Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Network Name</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network2Name || ''}
                          onChange={(e) => handleFieldChange('network2Name', e.target.value)}
                          className="text-sm h-8 mt-1"
                          data-testid="edit-network2-name"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network2Name}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Virtual Device</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network2VirtualDevice || ''}
                          onChange={(e) => handleFieldChange('network2VirtualDevice', e.target.value)}
                          className="text-sm h-8 mt-1"
                          data-testid="edit-network2-virtual-device"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network2VirtualDevice}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Gateway</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network2Gateway || ''}
                          onChange={(e) => handleFieldChange('network2Gateway', e.target.value)}
                          className="text-sm h-8 mt-1"
                          data-testid="edit-network2-gateway"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network2Gateway}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Address</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network2Address || ''}
                          onChange={(e) => handleFieldChange('network2Address', e.target.value)}
                          className="text-sm h-8 mt-1"
                          data-testid="edit-network2-address"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network2Address}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">DHCP</Label>
                      {isEditing ? (
                        <Select
                          value={currentData.network2Dhcp || ''}
                          onValueChange={(value) => handleFieldChange('network2Dhcp', value)}
                        >
                          <SelectTrigger className="text-sm h-8 mt-1" data-testid="edit-network2-dhcp">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {dhcpOptions.map(dhcp => (
                              <SelectItem key={dhcp} value={dhcp}>{dhcp}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network2Dhcp}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Subnet Mask</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network2SubnetMask || ''}
                          onChange={(e) => handleFieldChange('network2SubnetMask', e.target.value)}
                          className="text-sm h-8 mt-1"
                          data-testid="edit-network2-subnet"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network2SubnetMask}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">DNS Servers</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network2DnsServers || ''}
                          onChange={(e) => handleFieldChange('network2DnsServers', e.target.value)}
                          className="text-sm h-8 mt-1"
                          data-testid="edit-network2-dns"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network2DnsServers}</div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">MAC Address</Label>
                      {isEditing ? (
                        <Input 
                          value={currentData.network2MacAddress || ''}
                          onChange={(e) => handleFieldChange('network2MacAddress', e.target.value)}
                          className="text-sm h-8 mt-1"
                          data-testid="edit-network2-mac"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 mt-1">{currentData.network2MacAddress}</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Router Tab */}
          <TabsContent value="router" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Router size={18} />
                  Router Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Router size={48} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Router Configuration</h3>
                  <p className="text-xs text-gray-600">Router settings and configuration will be available here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Passwords Tab */}
          <TabsContent value="passwords" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Key size={18} />
                  Security & Credentials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-xs font-medium text-gray-700">IPC Username</Label>
                    {isEditing ? (
                      <Input 
                        value={currentData.ipcUsername || ''}
                        onChange={(e) => handleFieldChange('ipcUsername', e.target.value)}
                        className="text-sm h-8 mt-1"
                        data-testid="edit-ipc-username"
                      />
                    ) : (
                      <div className="text-sm text-gray-900 mt-1">{currentData.ipcUsername}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">IPC Password</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {isEditing ? (
                        <Input 
                          type={showPasswords[selectedIPC.id] ? "text" : "password"}
                          value={currentData.ipcPassword || ''}
                          onChange={(e) => handleFieldChange('ipcPassword', e.target.value)}
                          className="text-sm h-8"
                          data-testid="edit-ipc-password"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 flex-1">
                          {showPasswords[selectedIPC.id] ? currentData.ipcPassword : '••••••••••••'}
                        </div>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => togglePasswordVisibility(selectedIPC.id)}
                        data-testid="toggle-ipc-password-visibility"
                      >
                        {showPasswords[selectedIPC.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-700">AnyDesk Password</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {isEditing ? (
                        <Input 
                          type={showPasswords[`anydesk_${selectedIPC.id}`] ? "text" : "password"}
                          value={currentData.anydeskPassword || ''}
                          onChange={(e) => handleFieldChange('anydeskPassword', e.target.value)}
                          className="text-sm h-8"
                          data-testid="edit-anydesk-password"
                        />
                      ) : (
                        <div className="text-sm text-gray-900 flex-1">
                          {showPasswords[`anydesk_${selectedIPC.id}`] ? currentData.anydeskPassword : '••••••••••••'}
                        </div>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => setShowPasswords(prev => ({
                          ...prev,
                          [`anydesk_${selectedIPC.id}`]: !prev[`anydesk_${selectedIPC.id}`]
                        }))}
                        data-testid="toggle-anydesk-password-visibility"
                      >
                        {showPasswords[`anydesk_${selectedIPC.id}`] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}