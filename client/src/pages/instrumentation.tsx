import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Edit, Trash2, Settings, Camera, FileText, Activity } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { insertInstrumentationSchema, type Instrumentation, type Site } from '@shared/schema';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';

const instrumentationFormSchema = insertInstrumentationSchema.extend({
  installationDate: z.string().optional(),
  lastCalibration: z.string().optional(),
  nextCalibration: z.string().optional(),
});

type InstrumentationFormData = z.infer<typeof instrumentationFormSchema>;

const DEVICE_TYPES = [
  { value: 'flow_meter', label: 'Flow Meter', icon: Activity },
  { value: 'ph_sensor', label: 'pH Sensor', icon: Settings },
  { value: 'orp_sensor', label: 'ORP Sensor', icon: Settings },
  { value: 'analysis_box', label: 'Analysis Box', icon: Settings },
  { value: 'valve', label: 'Valve', icon: Settings },
  { value: 'pressure_transmitter', label: 'Pressure Transmitter', icon: Settings },
];

const COMMUNICATION_TYPES = [
  { value: '4-20ma', label: '4-20mA' },
  { value: 'rs485', label: 'RS485' },
  { value: 'hart', label: 'HART' },
  { value: 'modbus_tcp', label: 'Modbus TCP' },
  { value: 'modbus_rtu', label: 'Modbus RTU' },
  { value: 'profinet', label: 'Profinet' },
  { value: 'ethercat', label: 'EtherCAT' },
];

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  faulty: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const OPERATIONAL_STATUS_COLORS = {
  normal: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  alarm: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  fault: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export default function InstrumentationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedDeviceType, setSelectedDeviceType] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Instrumentation | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sites for filtering
  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ['/api/sites'],
  });

  // Fetch instrumentation devices
  const { data: devices = [], isLoading } = useQuery<Instrumentation[]>({
    queryKey: ['/api/instrumentation', selectedSite === 'all' ? undefined : selectedSite],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSite !== 'all') {
        params.append('siteId', selectedSite);
      }
      const response = await apiRequest(`/api/instrumentation?${params.toString()}`, "GET");
      return response.json();
    },
  });

  const form = useForm<InstrumentationFormData>({
    resolver: zodResolver(instrumentationFormSchema),
    defaultValues: {
      deviceName: '',
      deviceType: '',
      serialNumber: '',
      model: '',
      brandName: '',
      communicationType: '',
      voltage: '',
      location: '',
      status: 'active',
      operationalStatus: 'normal',
      comments: '',
      tags: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InstrumentationFormData) => {
      const processedData = {
        ...data,
        installationDate: data.installationDate ? new Date(data.installationDate) : undefined,
        lastCalibration: data.lastCalibration ? new Date(data.lastCalibration) : undefined,
        nextCalibration: data.nextCalibration ? new Date(data.nextCalibration) : undefined,
      };
      return await apiRequest('/api/instrumentation', 'POST', processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/instrumentation'] });
      setDialogOpen(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'Instrumentation device created successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create instrumentation device',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InstrumentationFormData> }) => {
      const processedData = {
        ...data,
        installationDate: data.installationDate ? new Date(data.installationDate) : undefined,
        lastCalibration: data.lastCalibration ? new Date(data.lastCalibration) : undefined,
        nextCalibration: data.nextCalibration ? new Date(data.nextCalibration) : undefined,
      };
      return await apiRequest(`/api/instrumentation/${id}`, 'PUT', processedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/instrumentation'] });
      setDialogOpen(false);
      setEditingDevice(null);
      form.reset();
      toast({
        title: 'Success',
        description: 'Instrumentation device updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update instrumentation device',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await apiRequest(`/api/instrumentation/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/instrumentation'] });
      toast({
        title: 'Success',
        description: 'Instrumentation device deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete instrumentation device',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: InstrumentationFormData) => {
    if (editingDevice) {
      updateMutation.mutate({ id: editingDevice.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (device: Instrumentation) => {
    setEditingDevice(device);
    const formData = {
      ...device,
      installationDate: device.installationDate ? new Date(device.installationDate).toISOString().split('T')[0] : '',
      lastCalibration: device.lastCalibration ? new Date(device.lastCalibration).toISOString().split('T')[0] : '',
      nextCalibration: device.nextCalibration ? new Date(device.nextCalibration).toISOString().split('T')[0] : '',
    };
    form.reset(formData);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this device?')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter devices based on search term and filters
  const filteredDevices = (devices as Instrumentation[]).filter((device: Instrumentation) => {
    const matchesSearch = device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.brandName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDeviceType = selectedDeviceType === 'all' || device.deviceType === selectedDeviceType;
    
    return matchesSearch && matchesDeviceType;
  });

  const getDeviceTypeLabel = (type: string) => {
    return DEVICE_TYPES.find(dt => dt.value === type)?.label || type;
  };

  const getCommunicationTypeLabel = (type: string) => {
    return COMMUNICATION_TYPES.find(ct => ct.value === type)?.label || type;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Instrumentation Management</h1>
          <p className="text-muted-foreground">
            Manage industrial devices including flow meters, sensors, valves, and transmitters
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingDevice(null);
                form.reset();
              }}
              data-testid="button-add-device"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingDevice ? 'Edit Instrumentation Device' : 'Add New Instrumentation Device'}
              </DialogTitle>
              <DialogDescription>
                {editingDevice ? 'Update device information and specifications' : 'Enter device information and technical specifications'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="siteId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-site">
                              <SelectValue placeholder="Select site" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sites.map(site => (
                              <SelectItem key={site.id} value={site.id}>
                                {site.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deviceName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Device Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Inlet Flow Meter 01" data-testid="input-device-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deviceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Device Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-device-type">
                              <SelectValue placeholder="Select device type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEVICE_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serial Number *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., FM-2024-001" data-testid="input-serial-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., FMX-200" data-testid="input-model" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brandName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Endress+Hauser" data-testid="input-brand-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="communicationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Communication Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-communication-type">
                              <SelectValue placeholder="Select communication type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COMMUNICATION_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="voltage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operating Voltage</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="e.g., 24VDC, 110VAC" data-testid="input-voltage" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="operatingRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operating Range</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="e.g., 0-100 L/min, 0-14 pH" data-testid="input-operating-range" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accuracy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accuracy</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="e.g., ±0.5%, ±0.01 pH" data-testid="input-accuracy" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="installationDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Installation Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-installation-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="e.g., Inlet manifold, Tank 1" data-testid="input-location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="faulty">Faulty</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="operationalStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operational Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-operational-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="alarm">Alarm</SelectItem>
                            <SelectItem value="fault">Fault</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deviceImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Device Image URL</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="https://example.com/device-image.jpg" data-testid="input-device-image" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="e.g., critical, main-line, backup" data-testid="input-tags" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comments</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          value={field.value || ''}
                          placeholder="Additional notes about the device..." 
                          className="min-h-[80px]"
                          data-testid="textarea-comments"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save"
                  >
                    {editingDevice ? 'Update Device' : 'Create Device'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
            data-testid="input-search"
          />
        </div>
        
        <Select value={selectedSite} onValueChange={setSelectedSite}>
          <SelectTrigger className="w-48" data-testid="select-filter-site">
            <SelectValue placeholder="Filter by site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {sites.map(site => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedDeviceType} onValueChange={setSelectedDeviceType}>
          <SelectTrigger className="w-48" data-testid="select-filter-device-type">
            <SelectValue placeholder="Filter by device type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Device Types</SelectItem>
            {DEVICE_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-devices">{(devices as Instrumentation[]).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-active-devices">
              {(devices as Instrumentation[]).filter((d: Instrumentation) => d.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Settings className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-maintenance-devices">
              {(devices as Instrumentation[]).filter((d: Instrumentation) => d.status === 'maintenance').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faulty</CardTitle>
            <Settings className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-faulty-devices">
              {(devices as Instrumentation[]).filter((d: Instrumentation) => d.status === 'faulty').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No devices found</h3>
          <p className="text-muted-foreground">
            {searchTerm || selectedSite !== 'all' || selectedDeviceType !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first instrumentation device'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device: Instrumentation) => (
            <Card key={device.id} className="hover:shadow-md transition-shadow" data-testid={`card-device-${device.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{device.deviceName}</CardTitle>
                    <CardDescription className="text-sm">
                      {getDeviceTypeLabel(device.deviceType)} • S/N: {device.serialNumber}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(device)}
                      data-testid={`button-edit-${device.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(device.id)}
                      data-testid={`button-delete-${device.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <div className="flex space-x-2">
                    <Badge className={STATUS_COLORS[device.status as keyof typeof STATUS_COLORS]}>
                      {device.status}
                    </Badge>
                    <Badge className={OPERATIONAL_STATUS_COLORS[device.operationalStatus as keyof typeof OPERATIONAL_STATUS_COLORS]}>
                      {device.operationalStatus}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Model:</span>
                    <p className="font-medium">{device.model}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Brand:</span>
                    <p className="font-medium">{device.brandName}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Communication:</span>
                  <p className="font-medium">{getCommunicationTypeLabel(device.communicationType)}</p>
                </div>

                {device.location && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-medium">{device.location}</p>
                  </div>
                )}

                {device.voltage && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Voltage:</span>
                    <p className="font-medium">{device.voltage}</p>
                  </div>
                )}

                {device.operatingRange && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Range:</span>
                    <p className="font-medium">{device.operatingRange}</p>
                  </div>
                )}

                {device.accuracy && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Accuracy:</span>
                    <p className="font-medium">{device.accuracy}</p>
                  </div>
                )}

                {device.installationDate && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Installed:</span>
                    <p className="font-medium">{new Date(device.installationDate).toLocaleDateString()}</p>
                  </div>
                )}

                {device.tags && (
                  <div className="flex flex-wrap gap-1">
                    {device.tags.split(',').map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                )}

                {device.deviceImage && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Camera className="h-4 w-4 mr-1" />
                    <span>Image available</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}