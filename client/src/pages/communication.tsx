import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCommunicationInterfaceSchema, type CommunicationInterface, type Site } from "@shared/schema";
import { Cable, Plus, Wifi, WifiOff, AlertCircle, Activity, Settings, Gauge } from "lucide-react";
import { z } from "zod";

const formSchema = insertCommunicationInterfaceSchema.extend({
  port: z.preprocess((val) => val ? Number(val) : undefined, z.number().optional()),
  baudRate: z.preprocess((val) => val ? Number(val) : undefined, z.number().optional()),
  stopBits: z.preprocess((val) => val ? Number(val) : undefined, z.number().optional()),
  dataBits: z.preprocess((val) => val ? Number(val) : undefined, z.number().optional()),
  slaveId: z.preprocess((val) => val ? Number(val) : undefined, z.number().optional()),
  description: z.string().optional(),
  ipAddress: z.string().optional(),
  deviceAddress: z.string().optional(),
});

export default function Communication() {
  const [selectedSiteId, setSelectedSiteId] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "",
      connectionType: "",
      status: "unknown",
      isActive: true,
    },
  });

  const { data: sites = [], isLoading: sitesLoading } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
  });

  const { data: interfaces = [], isLoading: interfacesLoading } = useQuery({
    queryKey: ["/api/communication-interfaces", selectedSiteId],
    queryFn: async (): Promise<CommunicationInterface[]> => {
      const params = selectedSiteId !== "all" ? `?siteId=${selectedSiteId}` : "";
      return await apiRequest(`/api/communication-interfaces${params}`, "GET");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      return await apiRequest("/api/communication-interfaces", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communication-interfaces"] });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createMutation.mutate(data);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <Wifi className="text-green-500" size={16} />;
      case "offline":
        return <WifiOff className="text-red-500" size={16} />;
      case "error":
        return <AlertCircle className="text-yellow-500" size={16} />;
      default:
        return <Activity className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-red-500";
      case "error":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "rs485":
        return <Cable className="text-blue-500" size={16} />;
      case "modbus_tcp":
      case "modbus_rtu":
        return <Settings className="text-purple-500" size={16} />;
      case "profinet":
        return <Activity className="text-green-500" size={16} />;
      case "4-20ma":
        return <Gauge className="text-orange-500" size={16} />;
      default:
        return <Cable className="text-gray-500" size={16} />;
    }
  };

  const formatLastCheck = (lastCheck: string | Date | null) => {
    if (!lastCheck) return "Never";
    const date = new Date(lastCheck);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
  };

  if (sitesLoading || interfacesLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Communication Protocols</h1>
          <p className="text-gray-600 mt-2">Manage industrial communication interfaces and protocols</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-interface">
              <Plus size={16} className="mr-2" />
              Add Interface
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Communication Interface</DialogTitle>
              <DialogDescription>
                Configure a new communication interface for industrial protocols
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="siteId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-site">
                              <SelectValue placeholder="Select site" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sites.map((site) => (
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interface Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., PLC Modbus Interface" {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the interface purpose" 
                          {...field} 
                          value={field.value || ""}
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Protocol Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-type">
                              <SelectValue placeholder="Select protocol" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="rs485">RS485</SelectItem>
                            <SelectItem value="4-20ma">4-20mA</SelectItem>
                            <SelectItem value="modbus_tcp">Modbus TCP</SelectItem>
                            <SelectItem value="modbus_rtu">Modbus RTU</SelectItem>
                            <SelectItem value="profinet">PROFINET</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="connectionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Connection Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-connection-type">
                              <SelectValue placeholder="Select connection" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="serial">Serial</SelectItem>
                            <SelectItem value="ethernet">Ethernet</SelectItem>
                            <SelectItem value="fieldbus">Fieldbus</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ipAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IP Address (TCP/Ethernet)</FormLabel>
                        <FormControl>
                          <Input placeholder="192.168.1.100" {...field} value={field.value || ""} data-testid="input-ip" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Port</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="502" {...field} data-testid="input-port" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="baudRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Baud Rate</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="9600" {...field} data-testid="input-baud-rate" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="parity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parity</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-parity">
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="odd">Odd</SelectItem>
                            <SelectItem value="even">Even</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stopBits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stop Bits</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1" {...field} data-testid="input-stop-bits" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dataBits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Bits</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="8" {...field} data-testid="input-data-bits" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="slaveId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slave ID (Modbus)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1" {...field} data-testid="input-slave-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deviceAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Device Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Device identifier" {...field} value={field.value || ""} data-testid="input-device-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                    data-testid="button-create-interface"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Interface"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
          <SelectTrigger className="w-48" data-testid="filter-site">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!interfaces || interfaces.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Cable className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Communication Interfaces</h3>
                <p className="text-gray-600 text-center max-w-sm">
                  Get started by adding your first communication interface to monitor industrial protocols.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          (interfaces as CommunicationInterface[]).map((interface_: CommunicationInterface) => {
            const site = sites.find(s => s.id === interface_.siteId);
            
            return (
              <Card key={interface_.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(interface_.type)}
                      <CardTitle className="text-lg" data-testid={`interface-name-${interface_.id}`}>
                        {interface_.name}
                      </CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(interface_.status)}
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(interface_.status)}`}></span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{site?.name || 'Unknown Site'}</span>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {interface_.type.toUpperCase().replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {interface_.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {interface_.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <Badge 
                        variant={interface_.status === 'online' ? 'default' : 'secondary'}
                        className={interface_.status === 'online' ? 'bg-green-500' : ''}
                      >
                        {interface_.status}
                      </Badge>
                    </div>
                    
                    {interface_.connectionType && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Connection:</span>
                        <span className="capitalize">{interface_.connectionType}</span>
                      </div>
                    )}
                    
                    {interface_.ipAddress && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">IP Address:</span>
                        <span className="font-mono text-xs">{interface_.ipAddress}</span>
                      </div>
                    )}
                    
                    {interface_.port && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Port:</span>
                        <span>{interface_.port}</span>
                      </div>
                    )}
                    
                    {interface_.baudRate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Baud Rate:</span>
                        <span>{interface_.baudRate}</span>
                      </div>
                    )}
                    
                    {interface_.slaveId && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Slave ID:</span>
                        <span>{interface_.slaveId}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Last Check:</span>
                      <span>{formatLastCheck(interface_.lastCheck)}</span>
                    </div>
                    {interface_.errorCount && interface_.errorCount > 0 && (
                      <div className="flex justify-between text-xs text-red-600 mt-1">
                        <span>Errors:</span>
                        <span>{interface_.errorCount}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}