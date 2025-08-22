import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Zap, 
  Cpu, 
  Network, 
  Factory,
  Plus,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Play,
  Wrench,
  Database,
  Trash2,
  Edit3,
  Eye,
  Download,
  FileText,
  Calculator,
  Gauge,
  Wifi,
  Cable,
  Cog,
  Activity,
  AlertCircle,
  Building,
  Layers
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { 
  AutomationProject, 
  InsertAutomationProject, 
  BeckhoffProduct,
  Site 
} from "@shared/schema";

// Form schemas
const projectSchema = z.object({
  siteId: z.string().min(1, "Site is required"),
  projectName: z.string().min(1, "Project name is required"),
  projectDescription: z.string().optional(),
  projectType: z.enum(["new_installation", "upgrade", "expansion"]),
});

const panelSchema = z.object({
  panelName: z.string().min(1, "Panel name is required"),
  panelDescription: z.string().optional(),
  panelLocation: z.string().min(1, "Location is required"),
  panelType: z.enum(["main_controller", "sub_panel", "remote_io"]),
  cabinetSize: z.enum(["compact", "medium", "large", "custom"]),
  enclosureRating: z.enum(["IP20", "IP54", "IP65"]),
});

const deviceSchema = z.object({
  deviceName: z.string().min(1, "Device name is required"),
  deviceType: z.enum(["motor", "flow_meter", "sensor", "valve", "pump"]),
  quantity: z.number().min(1).max(100),
  ioRequirements: z.object({
    digitalInputs: z.number().min(0).default(0),
    digitalOutputs: z.number().min(0).default(0),
    analogInputs: z.number().min(0).default(0),
    analogOutputs: z.number().min(0).default(0),
  }),
  specifications: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;
type PanelFormData = z.infer<typeof panelSchema>;
type DeviceFormData = z.infer<typeof deviceSchema>;

// Device templates for quick selection
const deviceTemplates = {
  motor: {
    "Standard Motor (Auto/Manual)": { digitalInputs: 3, digitalOutputs: 2, analogInputs: 1, analogOutputs: 0 },
    "VFD Motor (4-20mA)": { digitalInputs: 2, digitalOutputs: 1, analogInputs: 2, analogOutputs: 1 },
    "Servo Motor": { digitalInputs: 4, digitalOutputs: 2, analogInputs: 2, analogOutputs: 2 },
  },
  flow_meter: {
    "4-20mA Flow Meter": { digitalInputs: 1, digitalOutputs: 0, analogInputs: 1, analogOutputs: 0 },
    "Pulse Output Flow Meter": { digitalInputs: 1, digitalOutputs: 0, analogInputs: 0, analogOutputs: 0 },
    "Modbus Flow Meter": { digitalInputs: 0, digitalOutputs: 0, analogInputs: 0, analogOutputs: 0 },
  },
  sensor: {
    "Temperature Sensor (4-20mA)": { digitalInputs: 0, digitalOutputs: 0, analogInputs: 1, analogOutputs: 0 },
    "Pressure Sensor (0-10V)": { digitalInputs: 0, digitalOutputs: 0, analogInputs: 1, analogOutputs: 0 },
    "Level Sensor (Digital)": { digitalInputs: 1, digitalOutputs: 0, analogInputs: 0, analogOutputs: 0 },
    "Trip/Feedback Sensor": { digitalInputs: 1, digitalOutputs: 0, analogInputs: 0, analogOutputs: 0 },
  },
  valve: {
    "ON/OFF Valve": { digitalInputs: 2, digitalOutputs: 1, analogInputs: 0, analogOutputs: 0 },
    "Modulating Valve (4-20mA)": { digitalInputs: 2, digitalOutputs: 1, analogInputs: 1, analogOutputs: 1 },
  },
  pump: {
    "Standard Pump": { digitalInputs: 3, digitalOutputs: 2, analogInputs: 1, analogOutputs: 0 },
    "VFD Pump (4-20mA Control)": { digitalInputs: 2, digitalOutputs: 1, analogInputs: 2, analogOutputs: 1 },
  },
};

const communicationModules = [
  { id: "rs485", name: "RS485 Module", description: "Serial communication module", ports: 2 },
  { id: "profinet", name: "Profinet Module", description: "Industrial Ethernet communication", ports: 2 },
  { id: "modbus_tcp", name: "Modbus TCP", description: "Ethernet-based Modbus", ports: 1 },
  { id: "ethercat", name: "EtherCAT Slave", description: "High-performance fieldbus", ports: 2 },
];

const WIZARD_STEPS = [
  { id: 1, title: "Project Setup", description: "Basic project information", icon: Settings },
  { id: 2, title: "Main Controller", description: "Select primary PLC", icon: Cpu },
  { id: 3, title: "Panel Structure", description: "Define panel hierarchy", icon: Factory },
  { id: 4, title: "Device Selection", description: "Choose automation devices", icon: Zap },
  { id: 5, title: "Communication", description: "RS485, Profinet setup", icon: Network },
  { id: 6, title: "I/O Calculation", description: "Calculate module requirements", icon: Database },
  { id: 7, title: "Review & Generate", description: "Final preparation list", icon: CheckCircle },
];

export default function AutomationWizardPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [currentProject, setCurrentProject] = useState<AutomationProject | null>(null);
  const [selectedController, setSelectedController] = useState<BeckhoffProduct | null>(null);
  const [panels, setPanels] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [communicationSetup, setCommunicationSetup] = useState<any[]>([]);
  const [ioCalculation, setIoCalculation] = useState<any>(null);
  const [isCatalogInitialized, setIsCatalogInitialized] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const projectForm = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projectType: "new_installation",
    },
  });

  const panelForm = useForm<PanelFormData>({
    resolver: zodResolver(panelSchema),
    defaultValues: {
      panelType: "main_controller",
      cabinetSize: "medium",
      enclosureRating: "IP54",
    },
  });

  const deviceForm = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      deviceType: "motor",
      quantity: 1,
      ioRequirements: {
        digitalInputs: 0,
        digitalOutputs: 0,
        analogInputs: 0,
        analogOutputs: 0,
      },
    },
  });

  // Fetch sites for project creation
  const { data: sites = [], isLoading: sitesLoading } = useQuery<Site[]>({
    queryKey: ["/api/sites"],
  });

  // Fetch automation projects
  const { data: automationProjects = [], isLoading: projectsLoading } = useQuery<AutomationProject[]>({
    queryKey: ["/api/automation-projects"],
  });

  // Fetch Beckhoff products
  const { data: beckhoffProducts = [], isLoading: productsLoading } = useQuery<BeckhoffProduct[]>({
    queryKey: ["/api/beckhoff-products"],
    enabled: isCatalogInitialized,
  });

  // Initialize Beckhoff catalog
  const initCatalogMutation = useMutation({
    mutationFn: () => apiRequest("/api/automation/init-beckhoff-catalog", { method: "POST" }),
    onSuccess: () => {
      setIsCatalogInitialized(true);
      queryClient.invalidateQueries({ queryKey: ["/api/beckhoff-products"] });
      toast({ title: "Beckhoff catalog initialized successfully" });
    },
    onError: () => {
      toast({ title: "Failed to initialize catalog", variant: "destructive" });
    },
  });

  // Create new project
  const createProjectMutation = useMutation({
    mutationFn: (data: ProjectFormData) => 
      apiRequest("/api/automation-projects", { 
        method: "POST", 
        body: JSON.stringify(data) 
      }),
    onSuccess: (data) => {
      setCurrentProject(data);
      setCurrentStep(2);
      queryClient.invalidateQueries({ queryKey: ["/api/automation-projects"] });
      toast({ title: "Project created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create project", variant: "destructive" });
    },
  });

  // Initialize catalog on mount
  useEffect(() => {
    if (!isCatalogInitialized) {
      initCatalogMutation.mutate();
    }
  }, []);

  // Navigation functions
  const nextStep = () => {
    if (currentStep < WIZARD_STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const selectProject = (project: AutomationProject) => {
    setCurrentProject(project);
    setCurrentStep(2);
  };

  const onProjectSubmit = (data: ProjectFormData) => {
    createProjectMutation.mutate(data);
  };

  const addPanel = (data: PanelFormData) => {
    const newPanel = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      parentPanelId: data.panelType === "main_controller" ? null : panels.find(p => p.panelType === "main_controller")?.id,
      hierarchyLevel: data.panelType === "main_controller" ? 1 : data.panelType === "sub_panel" ? 2 : 3,
    };
    setPanels([...panels, newPanel]);
    panelForm.reset();
    toast({ title: "Panel added successfully" });
  };

  const addDevice = (data: DeviceFormData) => {
    const newDevice = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
    };
    setDevices([...devices, newDevice]);
    deviceForm.reset();
    toast({ title: "Device added successfully" });
  };

  const calculateIO = () => {
    const totalIO = devices.reduce((acc, device) => {
      const deviceIO = device.ioRequirements;
      return {
        digitalInputs: acc.digitalInputs + (deviceIO.digitalInputs * device.quantity),
        digitalOutputs: acc.digitalOutputs + (deviceIO.digitalOutputs * device.quantity),
        analogInputs: acc.analogInputs + (deviceIO.analogInputs * device.quantity),
        analogOutputs: acc.analogOutputs + (deviceIO.analogOutputs * device.quantity),
      };
    }, { digitalInputs: 0, digitalOutputs: 0, analogInputs: 0, analogOutputs: 0 });

    // Calculate required modules based on I/O counts
    const requiredModules = [];
    
    // Digital Input modules (16 channels each)
    if (totalIO.digitalInputs > 0) {
      const diModules = Math.ceil(totalIO.digitalInputs / 16);
      requiredModules.push({
        type: "Digital Input",
        partNumber: "EL1008",
        quantity: diModules,
        description: `${diModules} x 8-channel Digital Input modules`,
        totalChannels: diModules * 8,
        usedChannels: totalIO.digitalInputs,
      });
    }

    // Digital Output modules (8 channels each)
    if (totalIO.digitalOutputs > 0) {
      const doModules = Math.ceil(totalIO.digitalOutputs / 8);
      requiredModules.push({
        type: "Digital Output",
        partNumber: "EL2008",
        quantity: doModules,
        description: `${doModules} x 8-channel Digital Output modules`,
        totalChannels: doModules * 8,
        usedChannels: totalIO.digitalOutputs,
      });
    }

    // Analog Input modules (4 channels each)
    if (totalIO.analogInputs > 0) {
      const aiModules = Math.ceil(totalIO.analogInputs / 4);
      requiredModules.push({
        type: "Analog Input",
        partNumber: "EL3004",
        quantity: aiModules,
        description: `${aiModules} x 4-channel Analog Input modules (0-20mA)`,
        totalChannels: aiModules * 4,
        usedChannels: totalIO.analogInputs,
      });
    }

    // Analog Output modules (2 channels each)
    if (totalIO.analogOutputs > 0) {
      const aoModules = Math.ceil(totalIO.analogOutputs / 2);
      requiredModules.push({
        type: "Analog Output",
        partNumber: "EL4002",
        quantity: aoModules,
        description: `${aoModules} x 2-channel Analog Output modules (0-20mA)`,
        totalChannels: aoModules * 2,
        usedChannels: totalIO.analogOutputs,
      });
    }

    setIoCalculation({
      totalIO,
      requiredModules,
      estimatedCost: requiredModules.reduce((acc, module) => acc + (module.quantity * 150), 0), // Rough estimate
    });

    nextStep();
  };

  const generateReport = () => {
    const reportData = {
      project: currentProject,
      controller: selectedController,
      panels,
      devices,
      communication: communicationSetup,
      ioCalculation,
      timestamp: new Date().toISOString(),
    };
    
    // Create and download JSON report
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject?.projectName}-automation-plan.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: "Automation plan generated and downloaded!" });
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Project Setup
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Project Setup
                </CardTitle>
                <CardDescription>
                  Create a new automation project or continue with an existing one
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="new" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="new">New Project</TabsTrigger>
                    <TabsTrigger value="existing">Existing Projects</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="new" className="space-y-4">
                    <Form {...projectForm}>
                      <form onSubmit={projectForm.handleSubmit(onProjectSubmit)} className="space-y-4">
                        <FormField
                          control={projectForm.control}
                          name="siteId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Site</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-site">
                                    <SelectValue placeholder="Select a site" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.isArray(sites) && sites.map((site) => (
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
                          control={projectForm.control}
                          name="projectName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter project name" {...field} data-testid="input-project-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={projectForm.control}
                          name="projectDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe the project requirements..." 
                                  {...field} 
                                  data-testid="textarea-project-description"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={projectForm.control}
                          name="projectType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Project Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-project-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="new_installation">New Installation</SelectItem>
                                  <SelectItem value="upgrade">System Upgrade</SelectItem>
                                  <SelectItem value="expansion">Expansion</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={createProjectMutation.isPending}
                          data-testid="button-create-project"
                        >
                          {createProjectMutation.isPending ? "Creating..." : "Create Project & Continue"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  <TabsContent value="existing" className="space-y-4">
                    <div className="grid gap-4">
                      {Array.isArray(automationProjects) && automationProjects.map((project) => (
                        <Card 
                          key={project.id} 
                          className="cursor-pointer hover:bg-accent/50 transition-colors"
                          onClick={() => selectProject(project)}
                          data-testid={`card-project-${project.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold">{project.projectName}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {project.projectDescription || "No description"}
                                </p>
                                <Badge variant="outline" className="mt-2">
                                  {project.projectType}
                                </Badge>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {!projectsLoading && (!automationProjects || automationProjects.length === 0) && (
                        <div className="text-center py-8 text-muted-foreground">
                          No existing projects found. Create a new project to get started.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        );

      case 2: // Main Controller
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Main Controller Selection
                </CardTitle>
                <CardDescription>
                  Choose the primary Beckhoff controller for your automation project
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isCatalogInitialized ? (
                  <div className="text-center py-8">
                    <Button 
                      onClick={() => initCatalogMutation.mutate()}
                      disabled={initCatalogMutation.isPending}
                      data-testid="button-init-catalog"
                    >
                      {initCatalogMutation.isPending ? "Initializing..." : "Initialize Catalog"}
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Array.isArray(beckhoffProducts) && beckhoffProducts
                      .filter(product => product.category === "controller")
                      .map((controller) => (
                        <Card 
                          key={controller.id}
                          className={`cursor-pointer transition-colors ${
                            selectedController?.id === controller.id 
                              ? "ring-2 ring-primary bg-accent/50" 
                              : "hover:bg-accent/50"
                          }`}
                          onClick={() => setSelectedController(controller)}
                          data-testid={`card-controller-${controller.partNumber}`}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div>
                                <h3 className="font-semibold">{controller.productName}</h3>
                                <Badge variant="secondary">{controller.partNumber}</Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground">
                                {controller.productDescription}
                              </p>
                              
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Protocol:</span>
                                  <span className="font-medium">{controller.communicationProtocol}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Power:</span>
                                  <span className="font-medium">{controller.powerConsumption}W</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Supply:</span>
                                  <span className="font-medium">{controller.supplyVoltage}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Price:</span>
                                  <span className="font-semibold text-green-600">${controller.unitPrice}</span>
                                </div>
                              </div>
                              
                              {selectedController?.id === controller.id && (
                                <div className="flex items-center gap-2 text-primary">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="text-sm font-medium">Selected</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 3: // Panel Structure
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5" />
                  Panel Structure Configuration
                </CardTitle>
                <CardDescription>
                  Define your panel hierarchy (main controller, sub panels, remote I/O)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Add Panel Form */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Add Panel</h3>
                    <Form {...panelForm}>
                      <form onSubmit={panelForm.handleSubmit(addPanel)} className="space-y-4">
                        <FormField
                          control={panelForm.control}
                          name="panelName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Panel Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Main Control Panel" {...field} data-testid="input-panel-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={panelForm.control}
                          name="panelType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Panel Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-panel-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="main_controller">Main Controller</SelectItem>
                                  <SelectItem value="sub_panel">Sub Panel</SelectItem>
                                  <SelectItem value="remote_io">Remote I/O</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={panelForm.control}
                          name="panelLocation"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Control Room" {...field} data-testid="input-panel-location" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={panelForm.control}
                            name="cabinetSize"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cabinet Size</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-cabinet-size">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="compact">Compact</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="large">Large</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={panelForm.control}
                            name="enclosureRating"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Enclosure Rating</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-enclosure-rating">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="IP20">IP20</SelectItem>
                                    <SelectItem value="IP54">IP54</SelectItem>
                                    <SelectItem value="IP65">IP65</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={panelForm.control}
                          name="panelDescription"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Additional details..." {...field} data-testid="textarea-panel-description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" className="w-full" data-testid="button-add-panel">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Panel
                        </Button>
                      </form>
                    </Form>
                  </div>
                  
                  {/* Panel List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Configured Panels</h3>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {panels.map((panel) => (
                          <Card key={panel.id} data-testid={`card-panel-${panel.id}`}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4" />
                                    <span className="font-medium">{panel.panelName}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant={panel.panelType === "main_controller" ? "default" : "secondary"}>
                                      {panel.panelType.replace("_", " ")}
                                    </Badge>
                                    <span>{panel.panelLocation}</span>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {panel.cabinetSize} cabinet, {panel.enclosureRating}
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setPanels(panels.filter(p => p.id !== panel.id))}
                                  data-testid={`button-remove-panel-${panel.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        
                        {panels.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No panels configured yet. Add your first panel to get started.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4: // Device Selection
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Device Selection
                </CardTitle>
                <CardDescription>
                  Add automation devices (motors, flow meters, sensors) and configure their I/O requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Add Device Form */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Add Device</h3>
                    <Form {...deviceForm}>
                      <form onSubmit={deviceForm.handleSubmit(addDevice)} className="space-y-4">
                        <FormField
                          control={deviceForm.control}
                          name="deviceName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Device Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Feed Pump Motor" {...field} data-testid="input-device-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={deviceForm.control}
                          name="deviceType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Device Type</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  // Reset I/O requirements when device type changes
                                  deviceForm.setValue("ioRequirements", {
                                    digitalInputs: 0,
                                    digitalOutputs: 0,
                                    analogInputs: 0,
                                    analogOutputs: 0,
                                  });
                                }} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-device-type">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="motor">Motor</SelectItem>
                                  <SelectItem value="flow_meter">Flow Meter</SelectItem>
                                  <SelectItem value="sensor">Sensor</SelectItem>
                                  <SelectItem value="valve">Valve</SelectItem>
                                  <SelectItem value="pump">Pump</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={deviceForm.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="100"
                                  {...field} 
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  data-testid="input-device-quantity"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Device Templates */}
                        <div className="space-y-2">
                          <Label>Quick Templates</Label>
                          <div className="grid gap-2">
                            {Object.entries(deviceTemplates[deviceForm.watch("deviceType")] || {}).map(([templateName, ioReq]) => (
                              <Button
                                key={templateName}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => deviceForm.setValue("ioRequirements", ioReq)}
                                data-testid={`button-template-${templateName.replace(/\s+/g, '-').toLowerCase()}`}
                              >
                                {templateName}
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        {/* I/O Requirements */}
                        <div className="space-y-3">
                          <Label>I/O Requirements</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={deviceForm.control}
                              name="ioRequirements.digitalInputs"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">Digital Inputs</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      data-testid="input-digital-inputs"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={deviceForm.control}
                              name="ioRequirements.digitalOutputs"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">Digital Outputs</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      data-testid="input-digital-outputs"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={deviceForm.control}
                              name="ioRequirements.analogInputs"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">Analog Inputs</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      data-testid="input-analog-inputs"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={deviceForm.control}
                              name="ioRequirements.analogOutputs"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">Analog Outputs</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0" 
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      data-testid="input-analog-outputs"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        
                        <FormField
                          control={deviceForm.control}
                          name="specifications"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Specifications (Optional)</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Additional specifications..." {...field} data-testid="textarea-device-specs" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" className="w-full" data-testid="button-add-device">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Device
                        </Button>
                      </form>
                    </Form>
                  </div>
                  
                  {/* Device List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Configured Devices</h3>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-3">
                        {devices.map((device) => (
                          <Card key={device.id} data-testid={`card-device-${device.id}`}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Cog className="h-4 w-4" />
                                    <span className="font-medium">{device.deviceName}</span>
                                    <Badge variant="secondary">Qty: {device.quantity}</Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge>{device.deviceType.replace("_", " ")}</Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>DI: {device.ioRequirements.digitalInputs}</div>
                                    <div>DO: {device.ioRequirements.digitalOutputs}</div>
                                    <div>AI: {device.ioRequirements.analogInputs}</div>
                                    <div>AO: {device.ioRequirements.analogOutputs}</div>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setDevices(devices.filter(d => d.id !== device.id))}
                                  data-testid={`button-remove-device-${device.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        
                        {devices.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            No devices configured yet. Add your first device to get started.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 5: // Communication
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Communication Setup
                </CardTitle>
                <CardDescription>
                  Configure communication modules (RS485, Profinet, Modbus, EtherCAT)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {communicationModules.map((module) => {
                    const isSelected = communicationSetup.some(setup => setup.moduleId === module.id);
                    return (
                      <Card 
                        key={module.id}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "ring-2 ring-primary bg-accent/50" : "hover:bg-accent/50"
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            setCommunicationSetup(communicationSetup.filter(setup => setup.moduleId !== module.id));
                          } else {
                            setCommunicationSetup([...communicationSetup, {
                              moduleId: module.id,
                              moduleName: module.name,
                              ports: module.ports,
                              configured: true,
                            }]);
                          }
                        }}
                        data-testid={`card-communication-${module.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold flex items-center gap-2">
                                {module.id === 'rs485' && <Cable className="h-4 w-4" />}
                                {module.id === 'profinet' && <Wifi className="h-4 w-4" />}
                                {module.id === 'modbus_tcp' && <Network className="h-4 w-4" />}
                                {module.id === 'ethercat' && <Zap className="h-4 w-4" />}
                                {module.name}
                              </h3>
                              {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
                            </div>
                            
                            <p className="text-sm text-muted-foreground">
                              {module.description}
                            </p>
                            
                            <div className="flex justify-between items-center text-sm">
                              <span>Ports:</span>
                              <Badge variant="outline">{module.ports}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
                
                {communicationSetup.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="text-lg font-semibold">Selected Communication Modules</h3>
                    <div className="space-y-2">
                      {communicationSetup.map((setup) => (
                        <div key={setup.moduleId} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
                          <span className="font-medium">{setup.moduleName}</span>
                          <div className="flex items-center gap-2">
                            <Badge>Configured</Badge>
                            <span className="text-sm text-muted-foreground">{setup.ports} ports</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 6: // I/O Calculation
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  I/O Calculation & Module Recommendation
                </CardTitle>
                <CardDescription>
                  Automatic calculation of required I/O modules based on your devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!ioCalculation ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">Ready to Calculate I/O Requirements</h3>
                      <p className="text-muted-foreground mb-6">
                        Click below to automatically calculate the required Beckhoff I/O modules based on your device configuration.
                      </p>
                      <Button onClick={calculateIO} size="lg" data-testid="button-calculate-io">
                        <Calculator className="h-5 w-5 mr-2" />
                        Calculate I/O Requirements
                      </Button>
                    </div>
                    
                    {devices.length > 0 && (
                      <div className="mt-8">
                        <h4 className="font-semibold mb-4">Device Summary</h4>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {devices.reduce((acc, device) => acc + device.quantity, 0)}
                            </div>
                            <div className="text-sm text-blue-600">Total Devices</div>
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                              {devices.reduce((acc, device) => acc + (device.ioRequirements.digitalInputs * device.quantity), 0)}
                            </div>
                            <div className="text-sm text-green-600">Digital Inputs</div>
                          </div>
                          <div className="p-4 bg-orange-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">
                              {devices.reduce((acc, device) => acc + (device.ioRequirements.digitalOutputs * device.quantity), 0)}
                            </div>
                            <div className="text-sm text-orange-600">Digital Outputs</div>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">
                              {devices.reduce((acc, device) => acc + (device.ioRequirements.analogInputs * device.quantity) + (device.ioRequirements.analogOutputs * device.quantity), 0)}
                            </div>
                            <div className="text-sm text-purple-600">Analog I/O</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{ioCalculation.totalIO.digitalInputs}</div>
                        <div className="text-sm text-blue-600">Digital Inputs Required</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{ioCalculation.totalIO.digitalOutputs}</div>
                        <div className="text-sm text-green-600">Digital Outputs Required</div>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{ioCalculation.totalIO.analogInputs}</div>
                        <div className="text-sm text-orange-600">Analog Inputs Required</div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{ioCalculation.totalIO.analogOutputs}</div>
                        <div className="text-sm text-purple-600">Analog Outputs Required</div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Recommended I/O Modules</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Module Type</TableHead>
                            <TableHead>Part Number</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Channels</TableHead>
                            <TableHead>Utilization</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ioCalculation.requiredModules.map((module, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{module.type}</TableCell>
                              <TableCell>{module.partNumber}</TableCell>
                              <TableCell>{module.quantity}</TableCell>
                              <TableCell>{module.totalChannels}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-2 bg-gray-200 rounded">
                                    <div 
                                      className="h-full bg-primary rounded"
                                      style={{ width: `${(module.usedChannels / module.totalChannels) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-sm">
                                    {module.usedChannels}/{module.totalChannels}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">Cost Estimate</h4>
                      <div className="text-2xl font-bold text-green-600">
                        ${ioCalculation.estimatedCost.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Estimated cost for I/O modules (excluding controller and installation)
                      </div>
                    </div>
                    
                    <Button onClick={() => setIoCalculation(null)} variant="outline" data-testid="button-recalculate">
                      <Calculator className="h-4 w-4 mr-2" />
                      Recalculate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 7: // Review & Generate
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Review & Generate Automation Plan
                </CardTitle>
                <CardDescription>
                  Final review of your automation project and generate preparation list
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Project Summary */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Project Summary</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Project Name</Label>
                        <div className="font-medium">{currentProject?.projectName}</div>
                      </div>
                      <div>
                        <Label>Project Type</Label>
                        <Badge>{currentProject?.projectType}</Badge>
                      </div>
                      <div>
                        <Label>Selected Controller</Label>
                        <div className="font-medium">
                          {selectedController ? `${selectedController.productName} (${selectedController.partNumber})` : "None selected"}
                        </div>
                      </div>
                      <div>
                        <Label>Total Panels</Label>
                        <div className="font-medium">{panels.length}</div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Configuration Overview */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Panels ({panels.length})
                      </h4>
                      <ScrollArea className="h-32">
                        <div className="space-y-2">
                          {panels.map((panel) => (
                            <div key={panel.id} className="text-sm p-2 bg-gray-50 rounded">
                              <div className="font-medium">{panel.panelName}</div>
                              <div className="text-muted-foreground">{panel.panelLocation}</div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Devices ({devices.length})
                      </h4>
                      <ScrollArea className="h-32">
                        <div className="space-y-2">
                          {devices.map((device) => (
                            <div key={device.id} className="text-sm p-2 bg-gray-50 rounded">
                              <div className="font-medium">{device.deviceName}</div>
                              <div className="text-muted-foreground">Qty: {device.quantity}</div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Communication & I/O Summary */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Network className="h-4 w-4" />
                        Communication Modules
                      </h4>
                      {communicationSetup.length > 0 ? (
                        <div className="space-y-2">
                          {communicationSetup.map((setup) => (
                            <div key={setup.moduleId} className="text-sm p-2 bg-gray-50 rounded">
                              <div className="font-medium">{setup.moduleName}</div>
                              <div className="text-muted-foreground">{setup.ports} ports</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No communication modules selected</div>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        I/O Modules
                      </h4>
                      {ioCalculation ? (
                        <div className="space-y-2">
                          {ioCalculation.requiredModules.map((module, index) => (
                            <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                              <div className="font-medium">{module.partNumber}</div>
                              <div className="text-muted-foreground">Qty: {module.quantity}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">I/O calculation not completed</div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Generate Actions */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Generate Final Documentation</h4>
                    <div className="flex flex-wrap gap-4">
                      <Button onClick={generateReport} size="lg" data-testid="button-generate-report">
                        <Download className="h-5 w-5 mr-2" />
                        Download Automation Plan
                      </Button>
                      
                      <Button variant="outline" size="lg" data-testid="button-preview-3d">
                        <Eye className="h-5 w-5 mr-2" />
                        Preview 3D Layout
                      </Button>
                      
                      <Button variant="outline" size="lg" data-testid="button-export-bom">
                        <FileText className="h-5 w-5 mr-2" />
                        Export BOM
                      </Button>
                    </div>
                    
                    {ioCalculation && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h5 className="font-semibold text-green-800 mb-2">Project Ready!</h5>
                        <p className="text-sm text-green-700">
                          Your automation plan is complete with estimated cost of ${ioCalculation.estimatedCost.toLocaleString()} for I/O modules.
                          Download the plan above to proceed with procurement and installation.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return <div>Invalid step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Automation Wizard</h1>
          <p className="text-muted-foreground">
            Complete automation planning workflow for Beckhoff TwinCAT systems
          </p>
        </div>

        {/* Progress Indicator */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Step {currentStep} of {WIZARD_STEPS.length}: {WIZARD_STEPS[currentStep - 1]?.title}
              </h2>
              <div className="text-sm text-muted-foreground">
                {Math.round((currentStep / WIZARD_STEPS.length) * 100)}% Complete
              </div>
            </div>
            
            <Progress value={(currentStep / WIZARD_STEPS.length) * 100} className="mb-4" />
            
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
              {WIZARD_STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                
                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                    onClick={() => {
                      if (isCompleted || isActive) {
                        setCurrentStep(step.id);
                      }
                    }}
                    data-testid={`step-${step.id}`}
                  >
                    <Icon className="h-4 w-4 mb-1" />
                    <span className="text-xs font-medium text-center">
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        {currentProject && (
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  data-testid="button-prev-step"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <Button
                  onClick={nextStep}
                  disabled={currentStep === WIZARD_STEPS.length}
                  data-testid="button-next-step"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}