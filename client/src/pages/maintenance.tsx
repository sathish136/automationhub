import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Wrench,
  Plus,
  AlertTriangle,
  Clock,
  Mail,
  Settings,
  Calendar,
  Activity,
  MapPin,
  TrendingUp,
  Filter
} from "lucide-react";

interface Equipment {
  id: string;
  siteId: string;
  equipmentName: string;
  equipmentType: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  description?: string;
  currentRunningHours: number;
  lastHoursUpdate?: string;
  hoursDataSource: string;
  status: string;
  installationDate?: string;
  commissioningDate?: string;
  maintenanceEmailEnabled: boolean;
  emailRecipients: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MaintenanceSchedule {
  id: string;
  equipmentId: string;
  maintenanceType: string;
  description?: string;
  priority: string;
  maintenanceIntervalHours: number;
  lastMaintenanceHours: number;
  nextMaintenanceHours: number;
  warningThresholdHours: number;
  criticalThresholdHours: number;
  enableEmailAlerts: boolean;
  lastEmailSent?: string;
  emailFrequency: string;
  estimatedDuration?: number;
  requiredParts: any[];
  instructions?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function MaintenancePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Fetch equipment list
  const { data: equipment = [], isLoading: equipmentLoading } = useQuery({
    queryKey: ["/api/maintenance/equipment"],
    enabled: true,
  });

  // Fetch maintenance schedules for selected equipment
  const { data: schedules = [] } = useQuery({
    queryKey: ["/api/maintenance/schedules", selectedEquipment?.id],
    enabled: !!selectedEquipment?.id,
  });

  // Fetch equipment due for maintenance
  const { data: equipmentDue = [] } = useQuery({
    queryKey: ["/api/maintenance/due"],
    enabled: true,
  });

  // Fetch sites for dropdown
  const { data: sites = [] } = useQuery({
    queryKey: ["/api/sites"],
  });

  // Equipment form state
  const [equipmentForm, setEquipmentForm] = useState({
    siteId: "",
    equipmentName: "",
    equipmentType: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    location: "",
    description: "",
    currentRunningHours: 0,
    hoursDataSource: "manual",
    status: "active",
    installationDate: "",
    commissioningDate: "",
    maintenanceEmailEnabled: true,
    emailRecipients: [],
  });

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    equipmentId: "",
    maintenanceType: "",
    description: "",
    priority: "medium",
    maintenanceIntervalHours: 0,
    lastMaintenanceHours: 0,
    warningThresholdHours: 100,
    criticalThresholdHours: 50,
    enableEmailAlerts: true,
    emailFrequency: "daily",
    estimatedDuration: 60,
    requiredParts: [],
    instructions: "",
  });

  // Create equipment mutation
  const createEquipmentMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/maintenance/equipment", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance/equipment"] });
      setIsAddingEquipment(false);
      resetEquipmentForm();
      toast({
        title: "Success",
        description: "Equipment added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add equipment",
        variant: "destructive",
      });
    },
  });

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/maintenance/schedules", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance/schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance/due"] });
      setIsAddingSchedule(false);
      resetScheduleForm();
      toast({
        title: "Success",
        description: "Maintenance schedule created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create schedule",
        variant: "destructive",
      });
    },
  });

  // Send manual email mutation
  const sendEmailMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/maintenance/send-email", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Maintenance email sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    },
  });

  const resetEquipmentForm = () => {
    setEquipmentForm({
      siteId: "",
      equipmentName: "",
      equipmentType: "",
      manufacturer: "",
      model: "",
      serialNumber: "",
      location: "",
      description: "",
      currentRunningHours: 0,
      hoursDataSource: "manual",
      status: "active",
      installationDate: "",
      commissioningDate: "",
      maintenanceEmailEnabled: true,
      emailRecipients: [],
    });
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      equipmentId: "",
      maintenanceType: "",
      description: "",
      priority: "medium",
      maintenanceIntervalHours: 0,
      lastMaintenanceHours: 0,
      warningThresholdHours: 100,
      criticalThresholdHours: 50,
      enableEmailAlerts: true,
      emailFrequency: "daily",
      estimatedDuration: 60,
      requiredParts: [],
      instructions: "",
    });
  };

  const handleCreateEquipment = () => {
    createEquipmentMutation.mutate(equipmentForm);
  };

  const handleCreateSchedule = () => {
    const scheduleData = {
      ...scheduleForm,
      equipmentId: selectedEquipment?.id || scheduleForm.equipmentId,
      nextMaintenanceHours: scheduleForm.lastMaintenanceHours + scheduleForm.maintenanceIntervalHours,
    };
    createScheduleMutation.mutate(scheduleData);
  };

  const handleSendEmail = (equipmentId: string, scheduleId?: string) => {
    sendEmailMutation.mutate({
      equipmentId,
      scheduleId,
      emailType: "manual",
    });
  };

  const getMaintenanceStatus = (equipment: any, schedule: any) => {
    const currentHours = equipment.currentRunningHours || 0;
    const nextDue = schedule.nextMaintenanceHours || 0;
    const warning = schedule.warningThresholdHours || 100;
    const critical = schedule.criticalThresholdHours || 50;

    if (currentHours >= nextDue) {
      return { status: "overdue", color: "destructive", hoursOverdue: currentHours - nextDue };
    } else if (currentHours >= nextDue - critical) {
      return { status: "critical", color: "destructive", hoursUntilDue: nextDue - currentHours };
    } else if (currentHours >= nextDue - warning) {
      return { status: "warning", color: "secondary", hoursUntilDue: nextDue - currentHours };
    } else {
      return { status: "good", color: "default", hoursUntilDue: nextDue - currentHours };
    }
  };

  const filteredEquipment = equipment.filter((eq: Equipment) => {
    if (filterType !== "all" && eq.equipmentType !== filterType) return false;
    if (filterStatus !== "all" && eq.status !== filterStatus) return false;
    return true;
  });

  const equipmentTypes = ["blower", "pump", "filter", "clarifier", "valve", "motor", "compressor", "fan"];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Wrench className="h-8 w-8 text-blue-600" />
              Equipment Maintenance Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track running hours and schedule automatic maintenance alerts for water treatment equipment
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddingEquipment} onOpenChange={setIsAddingEquipment}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Equipment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Equipment</DialogTitle>
                  <DialogDescription>
                    Add equipment to track running hours and schedule maintenance
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="site">Site</Label>
                      <Select 
                        value={equipmentForm.siteId} 
                        onValueChange={(value) => setEquipmentForm({...equipmentForm, siteId: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select site" />
                        </SelectTrigger>
                        <SelectContent>
                          {sites.map((site: any) => (
                            <SelectItem key={site.id} value={site.id}>
                              {site.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="equipmentName">Equipment Name</Label>
                      <Input
                        id="equipmentName"
                        value={equipmentForm.equipmentName}
                        onChange={(e) => setEquipmentForm({...equipmentForm, equipmentName: e.target.value})}
                        placeholder="e.g., Main Blower #1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="equipmentType">Equipment Type</Label>
                      <Select 
                        value={equipmentForm.equipmentType} 
                        onValueChange={(value) => setEquipmentForm({...equipmentForm, equipmentType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipmentTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manufacturer">Manufacturer</Label>
                      <Input
                        id="manufacturer"
                        value={equipmentForm.manufacturer}
                        onChange={(e) => setEquipmentForm({...equipmentForm, manufacturer: e.target.value})}
                        placeholder="e.g., ABB, Siemens"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        value={equipmentForm.model}
                        onChange={(e) => setEquipmentForm({...equipmentForm, model: e.target.value})}
                        placeholder="Model number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serialNumber">Serial Number</Label>
                      <Input
                        id="serialNumber"
                        value={equipmentForm.serialNumber}
                        onChange={(e) => setEquipmentForm({...equipmentForm, serialNumber: e.target.value})}
                        placeholder="Serial number"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={equipmentForm.location}
                        onChange={(e) => setEquipmentForm({...equipmentForm, location: e.target.value})}
                        placeholder="Physical location"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentHours">Current Running Hours</Label>
                      <Input
                        id="currentHours"
                        type="number"
                        value={equipmentForm.currentRunningHours}
                        onChange={(e) => setEquipmentForm({...equipmentForm, currentRunningHours: Number(e.target.value)})}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={equipmentForm.description}
                      onChange={(e) => setEquipmentForm({...equipmentForm, description: e.target.value})}
                      placeholder="Equipment description"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddingEquipment(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateEquipment} disabled={createEquipmentMutation.isPending}>
                    {createEquipmentMutation.isPending ? "Adding..." : "Add Equipment"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Maintenance Alerts Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {equipmentDue.filter((eq: any) => eq.hoursOverdue > 0).length}
              </div>
              <p className="text-xs text-gray-600">Equipment overdue for maintenance</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Critical
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {equipmentDue.filter((eq: any) => eq.hoursOverdue === 0 && eq.hoursUntilDue <= eq.criticalThreshold).length}
              </div>
              <p className="text-xs text-gray-600">Equipment in critical maintenance window</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600 flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Warning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {equipmentDue.filter((eq: any) => eq.hoursOverdue === 0 && eq.hoursUntilDue > eq.criticalThreshold && eq.hoursUntilDue <= eq.warningThreshold).length}
              </div>
              <p className="text-xs text-gray-600">Equipment approaching maintenance</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                Total Equipment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {equipment.length}
              </div>
              <p className="text-xs text-gray-600">Total tracked equipment</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="equipment" className="space-y-4">
          <TabsList>
            <TabsTrigger value="equipment">Equipment List</TabsTrigger>
            <TabsTrigger value="maintenance-due">Maintenance Due</TabsTrigger>
            <TabsTrigger value="schedules">Maintenance Schedules</TabsTrigger>
          </TabsList>

          <TabsContent value="equipment" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="space-y-2">
                    <Label>Equipment Type</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {equipmentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="repair">Repair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipment List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipment.map((eq: Equipment) => (
                <Card key={eq.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedEquipment(eq)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{eq.equipmentName}</CardTitle>
                        <CardDescription>
                          {eq.equipmentType.charAt(0).toUpperCase() + eq.equipmentType.slice(1)} • {eq.manufacturer}
                        </CardDescription>
                      </div>
                      <Badge variant={eq.status === "active" ? "default" : "secondary"}>
                        {eq.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Running Hours:</span>
                        <span className="font-medium">{eq.currentRunningHours.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Location:</span>
                        <span className="text-sm">{eq.location || "Not specified"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Email Alerts:</span>
                        <Badge variant={eq.maintenanceEmailEnabled ? "default" : "secondary"}>
                          {eq.maintenanceEmailEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="maintenance-due" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Equipment Due for Maintenance
                </CardTitle>
                <CardDescription>
                  Equipment that needs maintenance based on running hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {equipmentDue.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No equipment currently due for maintenance</p>
                  ) : (
                    equipmentDue.map((item: any) => {
                      const statusInfo = getMaintenanceStatus(item, item);
                      return (
                        <div key={item.equipmentId} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{item.equipmentName}</h3>
                              <p className="text-sm text-gray-600">
                                {item.equipmentType.charAt(0).toUpperCase() + item.equipmentType.slice(1)} • {item.maintenanceType}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={statusInfo.color as any}>
                                {statusInfo.status.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">
                                {item.priority.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Current Hours:</span>
                              <div className="font-medium">{item.currentHours?.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Due at Hours:</span>
                              <div className="font-medium">{item.nextDueHours?.toLocaleString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">
                                {statusInfo.hoursOverdue > 0 ? "Hours Overdue:" : "Hours Until Due:"}
                              </span>
                              <div className={`font-medium ${statusInfo.hoursOverdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {statusInfo.hoursOverdue > 0 ? statusInfo.hoursOverdue : statusInfo.hoursUntilDue}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSendEmail(item.equipmentId);
                                }}
                                disabled={sendEmailMutation.isPending}
                              >
                                <Mail className="h-4 w-4 mr-1" />
                                Send Email
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedules">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Maintenance Schedules</CardTitle>
                    <CardDescription>
                      {selectedEquipment
                        ? `Schedules for ${selectedEquipment.equipmentName}`
                        : "Select equipment to view schedules"}
                    </CardDescription>
                  </div>
                  {selectedEquipment && (
                    <Dialog open={isAddingSchedule} onOpenChange={setIsAddingSchedule}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Schedule
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Maintenance Schedule</DialogTitle>
                          <DialogDescription>
                            Create a new maintenance schedule for {selectedEquipment.equipmentName}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Maintenance Type</Label>
                              <Select 
                                value={scheduleForm.maintenanceType} 
                                onValueChange={(value) => setScheduleForm({...scheduleForm, maintenanceType: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="oil_change">Oil Change</SelectItem>
                                  <SelectItem value="filter_replacement">Filter Replacement</SelectItem>
                                  <SelectItem value="cleaning">Cleaning</SelectItem>
                                  <SelectItem value="inspection">Inspection</SelectItem>
                                  <SelectItem value="lubrication">Lubrication</SelectItem>
                                  <SelectItem value="calibration">Calibration</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Priority</Label>
                              <Select 
                                value={scheduleForm.priority} 
                                onValueChange={(value) => setScheduleForm({...scheduleForm, priority: value})}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Interval (Hours)</Label>
                              <Input
                                type="number"
                                value={scheduleForm.maintenanceIntervalHours}
                                onChange={(e) => setScheduleForm({...scheduleForm, maintenanceIntervalHours: Number(e.target.value)})}
                                placeholder="e.g., 3000"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Last Maintenance (Hours)</Label>
                              <Input
                                type="number"
                                value={scheduleForm.lastMaintenanceHours}
                                onChange={(e) => setScheduleForm({...scheduleForm, lastMaintenanceHours: Number(e.target.value)})}
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={scheduleForm.description}
                              onChange={(e) => setScheduleForm({...scheduleForm, description: e.target.value})}
                              placeholder="Maintenance description"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Instructions</Label>
                            <Textarea
                              value={scheduleForm.instructions}
                              onChange={(e) => setScheduleForm({...scheduleForm, instructions: e.target.value})}
                              placeholder="Step-by-step maintenance instructions"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsAddingSchedule(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateSchedule} disabled={createScheduleMutation.isPending}>
                            {createScheduleMutation.isPending ? "Creating..." : "Create Schedule"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedEquipment ? (
                  <p className="text-center text-gray-500 py-8">
                    Select equipment from the Equipment List tab to view its maintenance schedules
                  </p>
                ) : schedules.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No maintenance schedules found for {selectedEquipment.equipmentName}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {schedules.map((schedule: MaintenanceSchedule) => (
                      <div key={schedule.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold">{schedule.maintenanceType.replace('_', ' ').toUpperCase()}</h3>
                            <p className="text-sm text-gray-600">{schedule.description}</p>
                          </div>
                          <Badge variant={schedule.priority === "critical" ? "destructive" : "default"}>
                            {schedule.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Interval:</span>
                            <div className="font-medium">{schedule.maintenanceIntervalHours.toLocaleString()} hrs</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Next Due:</span>
                            <div className="font-medium">{schedule.nextMaintenanceHours.toLocaleString()} hrs</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Est. Duration:</span>
                            <div className="font-medium">{schedule.estimatedDuration} min</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Email Alerts:</span>
                            <Badge variant={schedule.enableEmailAlerts ? "default" : "secondary"}>
                              {schedule.enableEmailAlerts ? "On" : "Off"}
                            </Badge>
                          </div>
                        </div>
                        {schedule.instructions && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <h4 className="font-medium text-sm mb-1">Instructions:</h4>
                            <p className="text-sm text-gray-600">{schedule.instructions}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}